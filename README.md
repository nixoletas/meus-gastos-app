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

> **Dica:** em **Authentication → Providers → Email**, você pode desativar
> "Confirm email" durante o desenvolvimento para entrar logo após o cadastro.

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
  login.tsx                # Entrar / criar conta
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

- **Web estática:**
  ```bash
  npx expo export --platform web
  ```
  Os arquivos saem em `dist/` e podem ser publicados em qualquer hospedagem
  estática (Vercel, Netlify, GitHub Pages...).

- **Apps nativos:** use o [EAS Build](https://docs.expo.dev/build/introduction/):
  ```bash
  npx eas build --platform android
  npx eas build --platform ios
  ```
