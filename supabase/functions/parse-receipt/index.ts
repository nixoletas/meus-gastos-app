// Edge Function: parse-receipt
//
// Lê a foto de uma notinha já enviada ao Storage e transforma as linhas do
// cupom em subcompras (`expense_items`) do lançamento.
//
// Body: { receipt_id: string }
// Resposta: { ok, receipt, items, itemsTotal, mismatch }
//
// O cliente nunca manda a imagem para cá: ela já está no bucket privado
// `receipts`, e esta função baixa com o JWT do próprio usuário (a RLS do
// Storage garante que ninguém lê a nota de outra pessoa).
//
// Quem conversa com o modelo é `reader.ts` — Gemini (free tier) por padrão.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  apiKeyFor,
  currentProvider,
  type MediaType,
  missingKeyMessage,
  ReaderError,
  readReceipt,
} from './reader.ts';
import { checkSum, normalizeParsed } from '../_shared/receipt.ts';

/** Teto diário de notinhas por usuário: protege a cota (e a fatura, se houver). */
const DAILY_LIMIT = Number(Deno.env.get('RECEIPTS_DAILY_LIMIT') ?? '40');

/** A imagem já chega redimensionada do app; acima disso é abuso ou bug. */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

type Body = { receipt_id?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function mediaTypeFor(path: string, blobType?: string): MediaType {
  if (blobType === 'image/png' || blobType === 'image/webp' || blobType === 'image/jpeg') {
    return blobType;
  }
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  const provider = currentProvider();
  const apiKey = apiKeyFor(provider);
  if (!apiKey) {
    return json({ error: missingKeyMessage(provider) }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'Não autenticado' }, 401);

  // Cliente com o JWT do usuário: respeita RLS, só enxerga os dados dele.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'Sessão inválida' }, 401);

  const body = (await req.json().catch(() => ({}))) as Body;
  const receiptId = body.receipt_id;
  if (!receiptId) return json({ error: 'receipt_id é obrigatório' }, 400);

  const { data: receipt, error: receiptErr } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', receiptId)
    .maybeSingle();

  if (receiptErr) return json({ error: receiptErr.message }, 500);
  if (!receipt) return json({ error: 'Notinha não encontrada' }, 404);

  /** Marca a falha na própria linha: a tela mostra o motivo e oferece "tentar de novo". */
  const fail = async (message: string, status = 400) => {
    await supabase
      .from('receipts')
      .update({ status: 'failed', error: message })
      .eq('id', receiptId);
    return json({ error: message }, status);
  };

  // Cota diária. Conta notinhas criadas nas últimas 24h, não chamadas:
  // reprocessar uma foto que falhou não pode queimar a cota de quem já foi
  // prejudicado.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await supabase
    .from('receipts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayAgo);

  if (!countErr && (count ?? 0) > DAILY_LIMIT) {
    return await fail(
      `Você já leu ${DAILY_LIMIT} notinhas nas últimas 24 horas. Tente de novo amanhã.`,
      429
    );
  }

  await supabase
    .from('receipts')
    .update({ status: 'parsing', error: null })
    .eq('id', receiptId);

  try {
    const { data: file, error: downloadErr } = await supabase.storage
      .from('receipts')
      .download(receipt.storage_path);

    if (downloadErr || !file) {
      return await fail('Não consegui abrir a foto da notinha.', 404);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0) {
      return await fail('A foto chegou vazia. Tente enviar de novo.');
    }
    if (bytes.length > MAX_IMAGE_BYTES) {
      return await fail('A foto está grande demais. Tire outra com menos zoom.', 413);
    }

    const rawOutput = await readReceipt(provider, {
      base64: toBase64(bytes),
      mediaType: mediaTypeFor(receipt.storage_path, file.type),
      apiKey,
    });

    const parsed = normalizeParsed(rawOutput);
    if (parsed.items.length === 0 && parsed.total === null) {
      return await fail(
        'Não achei nenhum item nessa foto. Confira se a nota está inteira e legível.',
        422
      );
    }

    const { itemsTotal, mismatch } = checkSum(parsed);

    const { data: saved, error: saveErr } = await supabase.rpc('save_receipt_parse', {
      p_receipt_id: receiptId,
      p_payload: parsed,
    });
    if (saveErr) return await fail(saveErr.message, 500);

    const { data: items } = await supabase
      .from('expense_items')
      .select('*')
      .eq('receipt_id', receiptId)
      .order('position');

    return json({
      ok: true,
      receipt: saved,
      items: items ?? [],
      itemsTotal,
      mismatch,
    });
  } catch (err) {
    // ReaderError já vem com texto de tela ("cota acabou", "tente outra foto").
    if (err instanceof ReaderError) {
      return await fail(err.message, err.status);
    }
    console.error('parse-receipt', err);
    const detail = err instanceof Error ? err.message : String(err);
    return await fail(`Falha ao ler a notinha: ${detail}`, 500);
  }
});
