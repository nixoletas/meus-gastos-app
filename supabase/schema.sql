-- ============================================================================
--  Meus Gastos — schema do banco de dados (Supabase / PostgreSQL)
--  Cole este arquivo no SQL Editor do Supabase e execute uma única vez.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Categorias e subcategorias.
-- Uma subcategoria é uma categoria com parent_id apontando para a categoria-mãe.
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  icon        text not null default 'tag',
  color       text not null default '#0EA5A4',
  parent_id   uuid references public.categories (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists categories_user_idx   on public.categories (user_id);
create index if not exists categories_parent_idx on public.categories (parent_id);

-- ----------------------------------------------------------------------------
-- Lançamentos de gastos.
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  amount         numeric(12, 2) not null check (amount > 0),
  note           text,
  category_id    uuid references public.categories (id) on delete set null,
  subcategory_id uuid references public.categories (id) on delete set null,
  occurred_at    date not null default current_date,
  created_at     timestamptz not null default now()
);

create index if not exists expenses_user_idx     on public.expenses (user_id);
create index if not exists expenses_occurred_idx on public.expenses (user_id, occurred_at);

-- ----------------------------------------------------------------------------
-- Orçamentos / limites para alertas de gasto excessivo.
-- category_id NULL = limite geral (todas as categorias).
-- ----------------------------------------------------------------------------
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete cascade,
  period       text not null default 'month' check (period in ('month', 'year')),
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  created_at   timestamptz not null default now()
);

create index if not exists budgets_user_idx on public.budgets (user_id);

-- Evita orçamentos duplicados (um por categoria+período; um único geral por período).
create unique index if not exists budgets_unique_category
  on public.budgets (user_id, category_id, period)
  where category_id is not null;
create unique index if not exists budgets_unique_global
  on public.budgets (user_id, period)
  where category_id is null;

-- ============================================================================
--  Row Level Security: cada usuário só enxerga e altera os próprios dados.
-- ============================================================================
alter table public.categories enable row level security;
alter table public.expenses   enable row level security;
alter table public.budgets    enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['categories', 'expenses', 'budgets'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$s;', t);

    execute format(
      'create policy "%1$s_select" on public.%1$s for select using (auth.uid() = user_id);', t);
    execute format(
      'create policy "%1$s_insert" on public.%1$s for insert with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "%1$s_update" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "%1$s_delete" on public.%1$s for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================================
--  Exclusão de conta: o usuário logado pode apagar a própria conta.
--  Como roda com SECURITY DEFINER, consegue remover a linha de auth.users;
--  o ON DELETE CASCADE apaga automaticamente categorias, gastos e limites.
-- ============================================================================
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
