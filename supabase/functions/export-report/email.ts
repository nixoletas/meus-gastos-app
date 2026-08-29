// Envio do relatório por e-mail via Resend (https://resend.com).
// Requer os secrets RESEND_API_KEY e REPORT_FROM_EMAIL configurados na função.

import { Lang, t } from '../_shared/i18n.ts';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Valor em reais, formatado no idioma do relatório. */
const brl = (n: number, locale: string) =>
  n.toLocaleString(locale, { style: 'currency', currency: 'BRL' });

type SendArgs = {
  to: string;
  userName: string;
  periodLabel: string;
  periodKind: 'month' | 'year';
  total: number;
  count: number;
  filename: string;
  xlsx: Uint8Array;
  lang: Lang;
};

export async function sendReportEmail(args: SendArgs): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('REPORT_FROM_EMAIL') ?? 'Meus Gastos <onboarding@resend.dev>';
  if (!apiKey) throw new Error('RESEND_API_KEY não configurada na função.');

  const dict = t(args.lang).email;
  const kindWord = args.periodKind === 'year' ? dict.kindYear : dict.kindMonth;
  const money = (n: number) => brl(n, dict.locale);
  const html = `
  <div style="margin:0;padding:24px;background:#F4F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.08)">
      <div style="background:linear-gradient(135deg,#0EA5A4,#0B7C7B);padding:28px 28px 22px">
        <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-.3px">Meus Gastos</div>
        <div style="color:#D6F5F0;font-size:14px;margin-top:4px">${dict.header(kindWord, args.periodLabel)}</div>
      </div>
      <div style="padding:26px 28px">
        <p style="margin:0 0 16px;color:#0F172A;font-size:16px">${dict.hi(args.userName)}</p>
        <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">
          ${dict.body(args.periodKind === 'year' ? dict.theYear : dict.theMonth)}
        </p>
        <div style="display:flex;gap:12px;margin:0 0 8px">
          <div style="flex:1;background:#F1FAF9;border-radius:14px;padding:16px">
            <div style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase">${dict.totalSpent}</div>
            <div style="color:#0B7C7B;font-size:22px;font-weight:800;margin-top:4px">${money(args.total)}</div>
          </div>
          <div style="flex:1;background:#F1FAF9;border-radius:14px;padding:16px">
            <div style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase">${dict.entries}</div>
            <div style="color:#0B7C7B;font-size:22px;font-weight:800;margin-top:4px">${args.count}</div>
          </div>
        </div>
        <p style="margin:22px 0 0;color:#94A3B8;font-size:12px;line-height:1.5">
          ${dict.footer}
        </p>
      </div>
    </div>
  </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: dict.subject(kindWord, args.periodLabel),
      html,
      attachments: [{ filename: args.filename, content: toBase64(args.xlsx) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha ao enviar e-mail (Resend ${res.status}): ${detail}`);
  }
}
