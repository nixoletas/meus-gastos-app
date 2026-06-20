# 🚀 Checklist de lançamento — Meus Gastos

Guia prático para colocar o app no ar (foco em **Android + Web**; Apple fica para depois).

## ✅ Já pronto no código
- [x] Login sem senha (Google + código OTP por e-mail)
- [x] Exclusão de conta **dentro do app** (digitando "excluir")
- [x] Página web de exclusão de conta (`legal/exclusao-de-conta.html`) — exigida pelo Google
- [x] Política de Privacidade e Termos de Uso (in-app + `legal/*.html` para hospedar)
- [x] Seção "Sobre" nos Ajustes com versão e contato
- [x] Sincronização em tempo real, tema claro/escuro, ícones e splash

## 🚨 Antes de publicar (bloqueadores)

### 1. E-mail do OTP em produção (CRÍTICO)
O e-mail padrão do Supabase é só para teste (limite ~3–4/hora). Configure **SMTP próprio**:
- [ ] Criar conta em **Resend** (ou Amazon SES / Brevo) e um domínio remetente
- [ ] Configurar SPF/DKIM no DNS do domínio
- [ ] Supabase → **Authentication → SMTP Settings**: preencher host/usuário/senha
- [ ] Testar o envio do código

### 2. Trocar os placeholders
- [ ] `src/legal/content.ts` e `legal/*.html`: trocar `contato@meusgastos.app` pelo seu e-mail real
- [ ] Conferir `app.json` → `version` e `android.package` (`com.meusgastos.app`)

### 3. Hospedar as páginas legais
- [ ] Publicar `legal/privacidade.html`, `legal/termos.html` e `legal/exclusao-de-conta.html`
      (pode ser GitHub Pages, Netlify, Vercel — grátis)
- [ ] Guardar as URLs (serão pedidas na Play Store)

### 4. Supabase em modo produção
- [ ] Rodar `supabase/schema.sql` no projeto de produção
- [ ] Colar o template `supabase/email-otp.html` em Auth → Emails → Magic Link
- [ ] Ativar o Google provider e configurar as Redirect URLs (ver README)
- [ ] Conferir que o Realtime está habilitado nas tabelas
- [ ] Testar que um usuário NÃO acessa dados de outro (RLS)

## 📦 Build e publicação (Android)

### Pré-requisitos
- [ ] Conta Google Play Console (US$ 25, pagamento único)
- [ ] CNPJ ou CPF/MEI para a conta de desenvolvedor
- [ ] `npm i -g eas-cli` e `eas login`

### Build
```bash
eas build --platform android --profile preview      # APK para testar
eas build --platform android --profile production    # AAB para a loja
```

### Submissão
- [ ] Criar o app no Play Console (nome, descrição, ícone, screenshots)
- [ ] Preencher **Data Safety** (dados coletados: e-mail, foto, dados financeiros que o usuário insere; sem venda de dados)
- [ ] Informar a **URL da Política de Privacidade**
- [ ] Informar a **URL de exclusão de conta**
- [ ] Classificação etária (questionário)
- [ ] Subir o `.aab` e enviar para **teste interno** primeiro
```bash
eas submit --platform android --profile production
```

## 🌐 Web
```bash
npm run build:web      # gera dist/ com OpenGraph
```
- [ ] Publicar `dist/` em Vercel/Netlify
- [ ] Adicionar a URL final nas Redirect URLs do Supabase (Google)

## 🔭 Próximos passos (pós-lançamento)
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics básico (ex.: PostHog)
- [ ] Edição de nome/avatar para quem entra por e-mail
- [ ] Tratamento visual de erros de rede
- [ ] Testes automatizados dos utilitários (moeda/data)
- [ ] **Monetização** (relatório por e-mail, freemium): usar In-App Purchase via **RevenueCat**
      no mobile (regra das lojas) ou cobrança própria só na web. Exige MEI/CNPJ.

---
Dúvida sobre qualquer passo? Está tudo referenciado no `README.md`.
