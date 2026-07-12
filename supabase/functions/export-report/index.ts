// Edge Function: export-report
// Gera um relatório Excel (mensal ou anual) dos gastos do usuário autenticado,
// envia por e-mail via Resend e devolve o arquivo em base64 para download no cliente.
//
// Body: { period: 'month' | 'year', year: number, month?: number (1-12), send?: boolean }
// Resposta: { ok, filename, total, count, xlsxBase64 }
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildReportXlsx, makePeriodLabel, ReportExpense } from './report.ts';
import { sendReportEmail } from './email.ts';

type Body = {
  period: 'month' | 'year';
  year: number;
  month?: number;
  send?: boolean; // default true
};

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

// Primeiro e último dia (YYYY-MM-DD) do período pedido.
function rangeFor(kind: 'month' | 'year', year: number, month?: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (kind === 'year') {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const m = month ?? 1;
  const last = new Date(year, m, 0).getDate(); // dia 0 do mês seguinte = último do atual
  return { start: `${year}-${pad(m)}-01`, end: `${year}-${pad(m)}-${pad(last)}` };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Não autenticado' }, 401);

    // Cliente com o JWT do usuário: respeita RLS, só lê os dados dele.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Sessão inválida' }, 401);
    const user = userData.user;

    const body = (await req.json()) as Body;
    const kind: 'month' | 'year' = body.period === 'year' ? 'year' : 'month';
    const now = new Date();
    const year = Number.isFinite(body.year) ? body.year : now.getFullYear();
    const month = kind === 'month' ? (body.month ?? now.getMonth() + 1) : undefined;
    const send = body.send !== false;

    const { start, end } = rangeFor(kind, year, month);

    // Busca gastos do período + categorias (para nome/cor).
    const [expRes, catRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('amount, note, occurred_at, category_id, subcategory_id')
        .gte('occurred_at', start)
        .lte('occurred_at', end)
        .order('occurred_at', { ascending: false }),
      supabase.from('categories').select('id, name, color'),
    ]);

    if (expRes.error) return json({ error: expRes.error.message }, 500);

    const catMap = new Map<string, { name: string; color: string }>();
    for (const c of catRes.data ?? []) {
      catMap.set(c.id, { name: c.name, color: c.color });
    }

    const expenses: ReportExpense[] = (expRes.data ?? []).map((e) => {
      const cat = e.category_id ? catMap.get(e.category_id) : undefined;
      const sub = e.subcategory_id ? catMap.get(e.subcategory_id) : undefined;
      return {
        occurred_at: e.occurred_at,
        amount: Number(e.amount),
        note: e.note,
        category: cat?.name ?? 'Sem categoria',
        subcategory: sub?.name ?? '',
        color: cat?.color ?? '#64748B',
      };
    });

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const count = expenses.length;
    const periodLabel = makePeriodLabel(kind, year, month);

    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    const userName = (meta.full_name ?? meta.name ?? user.email ?? 'você').split(' ')[0];

    const xlsx = await buildReportXlsx({
      periodLabel,
      periodKind: kind,
      userName,
      expenses,
    });

    const slug =
      kind === 'year' ? String(year) : `${year}-${String(month).padStart(2, '0')}`;
    const filename = `meus-gastos-${slug}.xlsx`;

    if (send) {
      if (!user.email) return json({ error: 'Usuário sem e-mail cadastrado' }, 400);
      await sendReportEmail({
        to: user.email,
        userName,
        periodLabel,
        periodKind: kind,
        total,
        count,
        filename,
        xlsx,
      });
    }

    return json({
      ok: true,
      filename,
      total,
      count,
      sentTo: send ? user.email : null,
      xlsxBase64: toBase64(xlsx),
    });
  } catch (err) {
    console.error('export-report error:', err);
    return json({ error: (err as Error).message ?? 'Erro inesperado' }, 500);
  }
});
