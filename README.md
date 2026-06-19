# 💸 Meus Gastos

App brasileiro para **controlar gastos** — simples, rápido e bonito. Um único
código-base roda como **app mobile (iOS/Android)** e como **app web**, graças ao
Expo + React Native Web.

> Foco em uma coisa só: **lançar gastos**. Sem distrações, poucos menus, cada
> lançamento é satisfatório de fazer. 🇧🇷

---

## ✨ Funcionalidades

- 📱💻 **Dois apps, um código**: mobile (Expo) e web (React Native Web).
- ☁️ **Login + sincronização na nuvem** via Supabase — seus gastos no celular e
  na web, sempre iguais.
- ➕ **Lançamento rápido**: botão flutuante em qualquer tela, teclado numérico e
  máscara automática de **R$ (Real brasileiro)**.
- 🎉 **Dopamina a cada gasto**: animação de comemoração + vibração (haptics).
- 🗂️ **Categorias e subcategorias** com **ícones bonitos e busca** — já vêm
  várias criadas (Alimentação, Transporte, Moradia, Saúde, Lazer...).
- 📺 **Categoria "Assinaturas"** com os **logos reais** dos principais serviços
  (Netflix, Spotify, Uber, iFood, Disney+, Amazon Prime, Apple Music, Google,
  Microsoft 365, HBO Max, PlayStation, e mais).
- 🔎 **Busca** de categorias e subcategorias.
- 📊 **Gráficos**: gráfico de pizza (donut) com os gastos por categoria, com
  navegação **mensal** e **anual**.
- 📅 **Controle no tempo**: visão **mensal** e **anual**, com navegação entre
  períodos.
- 🚨 **Alertas de gasto excessivo**: aba **Meus Limites** para definir tetos
  (gerais ou por categoria) — o app avisa ao chegar a 80% e ao ultrapassar.
- 🌗 **Tema claro e escuro** (ou automático, seguindo o sistema).
- 🗑️ **Excluir conta** a qualquer momento (apaga todos os dados).

---

## 🚀 Como rodar

### 1. Pré-requisitos
- [Node.js 18+](https://nodejs.org)
- App **Expo Go** no celular (Android/iOS) para testar no aparelho — opcional.

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase (login + sincronização)
1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto.
2. No painel do projeto, abra **SQL Editor** e rode todo o conteúdo do arquivo
   [`supabase/schema.sql`](./supabase/schema.sql). Isso cria as tabelas e as
   regras de segurança (cada usuário só vê os próprios dados).
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - chave **`anon` `public`**
4. Crie o arquivo de ambiente a partir do exemplo:
   ```bash
   cp .env.example .env
   ```
   e preencha:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
   ```

> Se você abrir o app sem configurar o `.env`, ele mostra uma tela explicando
> exatamente esses passos.

> **Atualizando um banco já existente?** O `schema.sql` é idempotente — pode
> rodar de novo com segurança. Ele inclui a função `delete_account()`, usada
> pela opção "Excluir conta".

### 3.1. Login: Google + código por e-mail (OTP)

O app entra **sem senha** — só com Google ou um **código de 6 dígitos** enviado por e-mail.

**Código por e-mail (OTP):**
1. Em **Authentication → Emails → "Magic Link"**, cole o conteúdo de
   [`supabase/email-otp.html`](./supabase/email-otp.html). Ele usa a variável
   `{{ .Token }}` (o código), então o usuário recebe o **código** em vez de um link.
2. Em **Authentication → Providers → Email**, deixe **"Confirm email" desligado**
   (com OTP não há link de confirmação).

**Google:**
1. Em **Authentication → Providers → Google**, ative e preencha o **Client ID/Secret**
   (criados no Google Cloud Console).
2. Em **Authentication → URL Configuration**, adicione as **Redirect URLs**:
   - `meusgastos://` (app mobile)
   - a URL do seu site web (ex.: `http://localhost:8081` em dev e a de produção)

### 4. Rode o app

**Web** (abre no navegador):
```bash
npm run web
```

**Mobile** (escaneie o QR Code com o Expo Go):
```bash
npm start
```
ou diretamente:
```bash
npm run android   # Android
npm run ios       # iOS (precisa de macOS)
```

As primeiras categorias e subcategorias são criadas automaticamente no seu
primeiro login.

---

## 🧱 Estrutura do projeto

```
app/                       # Rotas (expo-router)
  _layout.tsx              # Providers + proteção de rotas (login)
  onboarding.tsx           # Boas-vindas (slides) na primeira vez
  login.tsx                # Entrar com Google ou e-mail (sem senha)
  otp.tsx                  # Código de 6 dígitos enviado por e-mail
  config.tsx               # Tela de "falta configurar o Supabase"
  novo.tsx                 # Lançar / editar gasto (com a comemoração)
  categoria.tsx            # Criar / editar categoria ou subcategoria
  (tabs)/
    index.tsx              # Home: total do período, limites de gasto, lista
    graficos.tsx           # Gráfico de pizza por categoria (mês/ano)
    categorias.tsx         # Gerenciar e buscar categorias/subcategorias
    limites.tsx            # Meus Limites: tetos de gasto e alertas
    ajustes.tsx            # Tema, conta, excluir conta

src/
  components/              # Componentes reutilizáveis (ícones, pickers, etc.)
  context/                 # AuthContext e DataContext (estado global)
  data/                    # Catálogo de ícones e categorias padrão
  lib/supabase.ts          # Cliente Supabase
  theme/                   # Cores e ThemeContext (claro/escuro)
  utils/                   # Moeda (R$), datas, análises, haptics
  types.ts                 # Tipos do domínio

supabase/schema.sql        # Schema do banco (rodar no Supabase)
```

---

## 🛠️ Tecnologias

- **Expo SDK 56** + **React Native 0.85** + **React 19**
- **expo-router** (navegação baseada em arquivos)
- **Supabase** (autenticação + PostgreSQL + Row Level Security)
- **react-native-reanimated** (animações da comemoração)
- **expo-haptics** (vibração tátil)
- **@expo/vector-icons** (MaterialCommunityIcons)

---

## 📦 Gerar build de produção

- **Web (com OpenGraph):**
  ```bash
  npm run build:web
  ```
  Roda o `expo export` e injeta as meta tags de OpenGraph/SEO no `dist/index.html`.
  Os arquivos saem em `dist/` e podem ser publicados em qualquer hospedagem
  estática (Vercel, Netlify, GitHub Pages...).

- **Gerar ícones/splash/OpenGraph** a partir do mascote:
  ```bash
  npm run gen:assets
  ```

- **Apps nativos:** use o [EAS Build](https://docs.expo.dev/build/introduction/):
  ```bash
  npx eas build --platform android
  npx eas build --platform ios
  ```

## 🐷 Identidade visual

O mascote é o **Pim**, um porquinho-cofrinho — símbolo universal de poupança e
dinheiro. Ele aparece **animado** na tela de login (respira, pisca e "engole"
uma moedinha de R$) e é a base do ícone do app, splash, favicon e da imagem de
compartilhamento (OpenGraph). Paleta de marca: teal `#0EA5A4` → ciano `#0891B2`.

- **Pacotes:** iOS `com.meusgastos.app` · Android `com.meusgastos.app`
- **Fonte:** Space Grotesk (numerais marcantes, ótima para valores)
