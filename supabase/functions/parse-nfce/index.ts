// Edge Function: parse-nfce
//
// Lê o QR Code de um cupom fiscal (NFC-e) e traz os itens direto do portal da
// SEFAZ: exatos, de graça e sem mandar imagem para ninguém.
//
// Body: { receipt_id: string }  — a linha em `receipts` já foi criada pelo app
//                                 com `source = 'qrcode'` e `qr_url`.
// Resposta: { ok, receipt, items, itemsTotal, mismatch, duplicate }
//
// Quando o portal da UF não segue o layout de referência, a leitura falha de
// propósito e a tela oferece o outro caminho: fotografar a nota.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { checkSum, normalizeParsed } from '../_shared/receipt.ts';
import { chaveDaUrl, chaveValida, dadosDaChave, portalPermitido } from './chave.ts';
import { lerPaginaNfce } from './scrape.ts';

/** Teto diário por usuário: a consulta é grátis, mas não somos proxy de ninguém. */
const DAILY_LIMIT = Number(Deno.env.get('NFCE_DAILY_LIMIT') ?? '200');

/** Portal de SEFAZ lento é comum; parar de esperar é melhor que travar a tela. */
const FETCH_TIMEOUT_MS = 15000;

type Body = { receipt_id?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'Não autenticado' }, 401);

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

  const fail = async (message: string, status = 400) => {
    await supabase
      .from('receipts')
      .update({ status: 'failed', error: message })
      .eq('id', receiptId);
    return json({ error: message }, status);
  };

  const qrUrl: string | null = receipt.qr_url;
  if (!qrUrl) return await fail('Essa notinha não tem QR Code.', 400);

  if (!portalPermitido(qrUrl)) {
    return await fail('Esse QR Code não aponta para um portal da SEFAZ.', 400);
  }

  const chave = chaveDaUrl(qrUrl);
  if (!chave || !chaveValida(chave)) {
    return await fail('Não reconheci a chave dessa nota. Tente ler o QR de novo.', 422);
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('receipts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayAgo);
  if ((count ?? 0) > DAILY_LIMIT) {
    return await fail('Muitas notinhas nas últimas 24 horas. Tente amanhã.', 429);
  }

  // A chave é única por nota no país inteiro: se ela já virou gasto, avisamos
  // em vez de deixar a pessoa lançar a mesma compra duas vezes.
  const { data: jaLancada } = await supabase
    .from('receipts')
    .select('id, expense_id')
    .eq('access_key', chave)
    .neq('id', receiptId)
    .not('expense_id', 'is', null)
    .limit(1)
    .maybeSingle();

  await supabase
    .from('receipts')
    .update({ status: 'parsing', error: null })
    .eq('id', receiptId);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const resposta = await fetch(qrUrl, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          // Alguns portais devolvem página vazia para cliente sem User-Agent.
          'User-Agent': 'Mozilla/5.0 (compatible; MeusGastos/1.0; +https://meusgastos.dev.br)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      });
      if (!resposta.ok) {
        console.error('nfce http', resposta.status, qrUrl);
        return await fail(
          `O portal da SEFAZ respondeu ${resposta.status}. Tente de novo ou fotografe a nota.`,
          502
        );
      }
      html = await resposta.text();
    } finally {
      clearTimeout(timer);
    }

    const lida = lerPaginaNfce(html);
    const parsed = normalizeParsed({ ...lida, access_key: chave });

    if (parsed.items.length === 0) {
      // Diagnóstico só no log: a página pode conter CPF do consumidor.
      console.error('nfce sem itens', dadosDaChave(chave).uf, html.length);
      return await fail(
        'Consegui abrir a nota, mas não entendi a lista de itens desse estado. Fotografe a nota que eu leio pela imagem.',
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
      duplicate: jaLancada?.expense_id ?? null,
    });
  } catch (err) {
    const abortada = err instanceof DOMException && err.name === 'AbortError';
    console.error('parse-nfce', err);
    return await fail(
      abortada
        ? 'O portal da SEFAZ demorou demais para responder. Tente de novo.'
        : 'Não consegui consultar essa nota. Fotografe a notinha que eu leio pela imagem.',
      502
    );
  }
});
