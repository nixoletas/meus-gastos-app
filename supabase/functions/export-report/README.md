# export-report — relatório Excel por e-mail

Edge Function que gera um relatório Excel (`.xlsx`) bonito dos gastos do usuário
(mensal ou anual), envia por e-mail via [Resend](https://resend.com) e devolve o
arquivo em base64 para download direto no app/web.

## Como funciona

- Autentica pelo JWT do usuário (respeita RLS — só lê os dados dele).
- Body: `{ period: 'month' | 'year', year: number, month?: 1..12, send?: boolean }`
- Resposta: `{ ok, filename, total, count, sentTo, xlsxBase64 }`
- `send: true` (padrão) envia o e-mail; o cliente ainda recebe o base64 para baixar.

## Secrets necessários

`SUPABASE_URL` e `SUPABASE_ANON_KEY` já são injetados pela plataforma.
Configure os dois abaixo:

```bash
# API key da conta Resend (https://resend.com/api-keys)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# Remetente. Para testar sem domínio: onboarding@resend.dev
# Em produção, use um domínio verificado no Resend.
supabase secrets set REPORT_FROM_EMAIL="Meus Gastos <relatorios@seudominio.com>"
```

> Importante: a `RESEND_API_KEY` é um segredo de servidor. Ela mora só aqui,
> nunca no app (o `.env` do Expo com prefixo `EXPO_PUBLIC_` vai pro bundle).

## Deploy

```bash
# a partir de meus-gastos-app/
supabase functions deploy export-report
```

Testar localmente:

```bash
supabase functions serve export-report --env-file ./supabase/functions/.env.local
```
