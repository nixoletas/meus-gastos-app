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

-- ----------------------------------------------------------------------------
-- Preferências do usuário (uma linha por usuário), sincronizadas entre
-- web e app — ex.: ocultar o valor total na tela inicial.
-- ----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  hide_value  boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- ============================================================================
--  Row Level Security: cada usuário só enxerga e altera os próprios dados.
-- ============================================================================
alter table public.categories    enable row level security;
alter table public.expenses      enable row level security;
alter table public.budgets       enable row level security;
alter table public.user_settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['categories', 'expenses', 'budgets', 'user_settings'] loop
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

-- ============================================================================
--  Realtime: habilita a sincronização em tempo real das tabelas (idempotente).
--  Faz cada lançamento/categoria/limite refletir na hora em outros aparelhos.
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array['expenses', 'categories', 'budgets', 'user_settings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;


-- ============================================================================
--  NOTINHAS — foto da nota fiscal + subcompras (itens) de um lançamento.
--
--  Um item NÃO é um gasto. Se fosse, todo total (dashboard, gráficos, limites,
--  relatório) contaria o valor duas vezes. O total continua vindo só de
--  `expenses.amount`; os itens apenas detalham o que tem dentro dele.
-- ============================================================================

-- Foto da nota + metadados lidos por OCR. `expense_id` fica nulo enquanto o
-- lançamento ainda não foi salvo (o usuário anexa a foto antes de confirmar).
create table if not exists public.receipts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  expense_id     uuid references public.expenses (id) on delete cascade,
  storage_path   text not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'parsing', 'done', 'failed')),
  error          text,
  merchant       text,
  merchant_doc   text,          -- CNPJ, só dígitos
  issued_at      timestamptz,   -- data/hora impressa na nota
  payment_method text,          -- credito | debito | pix | dinheiro | vale | outro
  subtotal       numeric(12, 2),
  discount       numeric(12, 2),
  total          numeric(12, 2),
  access_key     text,          -- chave de acesso da NFC-e (44 dígitos)
  raw            jsonb,         -- resposta crua do modelo, para reprocessar depois
  created_at     timestamptz not null default now()
);

create index if not exists receipts_user_idx    on public.receipts (user_id, created_at desc);
create index if not exists receipts_expense_idx on public.receipts (expense_id);

-- Subcompras. `expense_id` nulo = rascunho, ainda preso só à notinha.
create table if not exists public.expense_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  expense_id   uuid references public.expenses (id) on delete cascade,
  receipt_id   uuid references public.receipts (id) on delete set null,
  description  text not null,
  raw_text     text,            -- descrição como veio impressa ("LEITE INT ITBA 1L")
  quantity     numeric(12, 3) not null default 1,
  unit         text,            -- un | kg | l | ...
  unit_price   numeric(12, 4),
  total        numeric(12, 2) not null,
  category_id  uuid references public.categories (id) on delete set null,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists expense_items_expense_idx on public.expense_items (expense_id, position);
create index if not exists expense_items_receipt_idx on public.expense_items (receipt_id);
create index if not exists expense_items_user_idx    on public.expense_items (user_id);

-- Contadores desnormalizados no gasto: a lista mostra "12 itens" sem query
-- extra, e o realtime que já escuta `expenses` atualiza a tela sozinho.
alter table public.expenses
  add column if not exists items_count int     not null default 0,
  add column if not exists has_receipt boolean not null default false;

-- ----------------------------------------------------------------------------
-- Triggers que mantêm os contadores em dia.
-- ----------------------------------------------------------------------------
create or replace function public.sync_expense_items_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.expense_id is not null then
    update public.expenses e
       set items_count = (select count(*) from public.expense_items i where i.expense_id = e.id)
     where e.id = old.expense_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.expense_id is not null then
    update public.expenses e
       set items_count = (select count(*) from public.expense_items i where i.expense_id = e.id)
     where e.id = new.expense_id;
  end if;
  return null;
end;
$fn$;

drop trigger if exists expense_items_count_sync on public.expense_items;
create trigger expense_items_count_sync
  after insert or update or delete on public.expense_items
  for each row execute function public.sync_expense_items_count();

create or replace function public.sync_expense_has_receipt()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.expense_id is not null then
    update public.expenses e
       set has_receipt = exists (select 1 from public.receipts r where r.expense_id = e.id)
     where e.id = old.expense_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.expense_id is not null then
    update public.expenses e
       set has_receipt = exists (select 1 from public.receipts r where r.expense_id = e.id)
     where e.id = new.expense_id;
  end if;
  return null;
end;
$fn$;

drop trigger if exists receipts_has_receipt_sync on public.receipts;
create trigger receipts_has_receipt_sync
  after insert or update or delete on public.receipts
  for each row execute function public.sync_expense_has_receipt();

-- ----------------------------------------------------------------------------
-- RLS das tabelas novas (mesmo padrão do resto do schema).
-- ----------------------------------------------------------------------------
alter table public.receipts      enable row level security;
alter table public.expense_items enable row level security;

do $rls$
declare
  t text;
begin
  foreach t in array array['receipts', 'expense_items'] loop
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
end $rls$;

-- Realtime: os itens chegam segundos depois do upload (o OCR é assíncrono),
-- então a tela precisa descobrir sozinha quando eles ficaram prontos.
do $rt$
declare
  t text;
begin
  foreach t in array array['receipts', 'expense_items'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $rt$;

-- ============================================================================
--  Bucket privado das fotos. Caminho: receipts/{user_id}/{uuid}.jpg
--  A primeira pasta do caminho é o id do dono — é isso que a policy confere.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $stg$
declare
  op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists "receipts_own_%s" on storage.objects;', op);
  end loop;
end $stg$;

create policy "receipts_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "receipts_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "receipts_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "receipts_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- ============================================================================
--  RPCs
--  Todas rodam como o usuário (security invoker): a RLS acima já garante que
--  ninguém escreve na notinha ou no gasto de outra pessoa.
-- ============================================================================

-- Grava o resultado do OCR: metadados na notinha + itens do zero.
-- Idempotente: reprocessar a mesma foto substitui os itens, não duplica.
create or replace function public.save_receipt_parse(
  p_receipt_id uuid,
  p_payload    jsonb
)
returns public.receipts
language plpgsql
as $fn$
declare
  r public.receipts;
begin
  select * into r from public.receipts where id = p_receipt_id;
  if not found then
    raise exception 'Notinha não encontrada';
  end if;

  delete from public.expense_items where receipt_id = p_receipt_id;

  insert into public.expense_items (
    user_id, expense_id, receipt_id, description, raw_text,
    quantity, unit, unit_price, total, position
  )
  select
    r.user_id,
    r.expense_id,
    r.id,
    coalesce(nullif(btrim(it->>'description'), ''), 'Item'),
    nullif(btrim(coalesce(it->>'raw_text', '')), ''),
    coalesce(nullif(it->>'quantity', '')::numeric, 1),
    nullif(btrim(coalesce(it->>'unit', '')), ''),
    nullif(it->>'unit_price', '')::numeric,
    round(coalesce(nullif(it->>'total', '')::numeric, 0), 2),
    (ord - 1)::int
  from jsonb_array_elements(coalesce(p_payload->'items', '[]'::jsonb))
       with ordinality as t(it, ord)
  where coalesce(nullif(it->>'total', '')::numeric, 0) >= 0;

  update public.receipts set
    status         = 'done',
    error          = null,
    merchant       = nullif(btrim(coalesce(p_payload->>'merchant', '')), ''),
    merchant_doc   = nullif(regexp_replace(coalesce(p_payload->>'merchant_doc', ''), '\D', '', 'g'), ''),
    issued_at      = nullif(p_payload->>'issued_at', '')::timestamptz,
    payment_method = nullif(btrim(coalesce(p_payload->>'payment_method', '')), ''),
    subtotal       = nullif(p_payload->>'subtotal', '')::numeric,
    discount       = nullif(p_payload->>'discount', '')::numeric,
    total          = nullif(p_payload->>'total', '')::numeric,
    access_key     = nullif(regexp_replace(coalesce(p_payload->>'access_key', ''), '\D', '', 'g'), ''),
    raw            = p_payload
  where id = p_receipt_id
  returning * into r;

  return r;
end;
$fn$;

-- Salva gasto + subcompras numa transação só. Sem isso, uma queda de rede no
-- meio deixa item órfão ou gasto sem os itens que o usuário acabou de revisar.
-- `p_expense_id` nulo cria; preenchido edita.
create or replace function public.save_expense_with_items(
  p_expense    jsonb,
  p_items      jsonb   default '[]'::jsonb,
  p_receipt_id uuid    default null,
  p_expense_id uuid    default null
)
returns public.expenses
language plpgsql
as $fn$
declare
  e   public.expenses;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Não autenticado';
  end if;

  if p_expense_id is null then
    insert into public.expenses (user_id, amount, note, category_id, subcategory_id, occurred_at)
    values (
      uid,
      round((p_expense->>'amount')::numeric, 2),
      nullif(btrim(coalesce(p_expense->>'note', '')), ''),
      nullif(p_expense->>'category_id', '')::uuid,
      nullif(p_expense->>'subcategory_id', '')::uuid,
      (p_expense->>'occurred_at')::date
    )
    returning * into e;
  else
    update public.expenses set
      amount         = round((p_expense->>'amount')::numeric, 2),
      note           = nullif(btrim(coalesce(p_expense->>'note', '')), ''),
      category_id    = nullif(p_expense->>'category_id', '')::uuid,
      subcategory_id = nullif(p_expense->>'subcategory_id', '')::uuid,
      occurred_at    = (p_expense->>'occurred_at')::date
    where id = p_expense_id
    returning * into e;

    if not found then
      raise exception 'Gasto não encontrado';
    end if;
  end if;

  -- A lista enviada é a verdade: o usuário pode ter apagado ou editado itens.
  delete from public.expense_items where expense_id = e.id;

  insert into public.expense_items (
    user_id, expense_id, receipt_id, description, raw_text,
    quantity, unit, unit_price, total, category_id, position
  )
  select
    uid,
    e.id,
    coalesce(nullif(it->>'receipt_id', '')::uuid, p_receipt_id),
    coalesce(nullif(btrim(it->>'description'), ''), 'Item'),
    nullif(btrim(coalesce(it->>'raw_text', '')), ''),
    coalesce(nullif(it->>'quantity', '')::numeric, 1),
    nullif(btrim(coalesce(it->>'unit', '')), ''),
    nullif(it->>'unit_price', '')::numeric,
    round(coalesce(nullif(it->>'total', '')::numeric, 0), 2),
    nullif(it->>'category_id', '')::uuid,
    (ord - 1)::int
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
       with ordinality as t(it, ord);

  -- Sobra de rascunho: itens que ficaram presos só à notinha.
  if p_receipt_id is not null then
    delete from public.expense_items
     where receipt_id = p_receipt_id and expense_id is null;

    update public.receipts
       set expense_id = e.id
     where id = p_receipt_id;
  end if;

  return e;
end;
$fn$;

-- Descarta uma notinha e o que ela criou de rascunho. O arquivo no Storage é
-- removido pelo cliente (a API de Storage é quem apaga o binário de verdade).
create or replace function public.discard_receipt(p_receipt_id uuid)
returns void
language plpgsql
as $fn$
begin
  delete from public.expense_items
   where receipt_id = p_receipt_id and expense_id is null;
  delete from public.receipts where id = p_receipt_id;
end;
$fn$;

-- Limpeza de notinhas abandonadas (usuário anexou a foto e fechou a tela).
-- O app já apaga na saída; isto é a rede de segurança, para rodar num cron.
create or replace function public.purge_orphan_receipts(p_older_than interval default '2 days')
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare
  n int;
begin
  with gone as (
    delete from public.receipts
     where expense_id is null
       and created_at < now() - p_older_than
    returning 1
  )
  select count(*) into n from gone;
  return n;
end;
$fn$;

revoke all on function public.purge_orphan_receipts(interval) from public, anon, authenticated;

-- ============================================================================
--  Exclusão de conta (redefinida): agora também limpa as fotos das notinhas.
--  O cascade em auth.users derruba receipts/expense_items junto com o resto.
-- ============================================================================
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
begin
  delete from storage.objects
   where bucket_id = 'receipts'
     and (storage.foldername(name))[1] = uid::text;

  delete from auth.users where id = uid;
end;
$fn$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- ============================================================================
--  NFC-e por QR Code — a notinha passa a ter duas origens.
--
--  Lendo o QR do cupom, os itens vêm do próprio portal da SEFAZ: exatos, de
--  graça e sem mandar imagem para ninguém. Nem toda nota tem QR (feira,
--  padaria, recibo), então a foto continua sendo o outro caminho — e uma
--  notinha de QR pode ganhar foto depois, e vice-versa.
-- ============================================================================
alter table public.receipts
  alter column storage_path drop not null;

alter table public.receipts
  add column if not exists source text not null default 'photo',
  add column if not exists qr_url text;

do $chk$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'receipts_source_check'
  ) then
    alter table public.receipts
      add constraint receipts_source_check check (source in ('photo', 'qrcode'));
  end if;
end $chk$;

-- Uma notinha precisa de foto OU de QR — linha sem nenhum dos dois é lixo.
do $chk$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'receipts_origin_check'
  ) then
    alter table public.receipts
      add constraint receipts_origin_check
      check (storage_path is not null or qr_url is not null);
  end if;
end $chk$;

-- Achar rápido se a mesma nota já foi lançada (a chave de acesso é única
-- por nota no Brasil inteiro). Não é índice único: quem lançar duas vezes
-- recebe um aviso na tela, não um erro do banco.
create index if not exists receipts_access_key_idx
  on public.receipts (user_id, access_key)
  where access_key is not null;
