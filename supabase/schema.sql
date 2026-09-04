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


-- ============================================================================
--  COMPARTILHAR COM A FAMÍLIA
--
--  Um caderno só: gastos, categorias e limites continuam sendo do DONO. Quem foi
--  convidado enxerga o mesmo caderno e, se for `editor`, escreve dentro dele —
--  sem nunca virar dono de nada. O convite é por e-mail e fica pendente até a
--  pessoa entrar com aquela conta Google.
-- ============================================================================

create table if not exists public.household_members (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  -- Nulo enquanto o convite não foi reivindicado pela pessoa certa.
  member_id     uuid references auth.users (id) on delete cascade,
  invited_email text not null,
  role          text not null default 'viewer'  check (role   in ('viewer', 'editor')),
  status        text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  -- Desnormalizado no convite/claim: `auth.users` não é legível pelo cliente e
  -- as telas precisam mostrar de quem é o caderno e quem é o convidado.
  owner_email   text not null default '',
  owner_name    text,
  member_name   text,
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  constraint household_members_email_lower
    check (invited_email = lower(btrim(invited_email)) and invited_email <> ''),
  constraint household_members_not_self
    check (member_id is null or member_id <> owner_id)
);

-- Um convite por e-mail em cada caderno: reconvidar atualiza a mesma linha.
create unique index if not exists household_members_owner_email_key
  on public.household_members (owner_id, invited_email);
-- A mesma pessoa não entra duas vezes no mesmo caderno (com dois e-mails dela).
create unique index if not exists household_members_owner_member_key
  on public.household_members (owner_id, member_id)
  where member_id is not null;
create index if not exists household_members_member_idx
  on public.household_members (member_id, status);
create index if not exists household_members_claim_idx
  on public.household_members (invited_email)
  where member_id is null and status = 'pending';

-- ----------------------------------------------------------------------------
--  De quais cadernos eu posso ler / em quais posso escrever.
--
--  SECURITY DEFINER de propósito: a função enxerga `household_members` sem
--  passar pela RLS dela, o que elimina qualquer chance de recursão entre as
--  policies. Como retorna conjunto, a policy vira `user_id in (select ...)` —
--  subconsulta não correlacionada, que o Postgres resolve UMA vez por query
--  (InitPlan com hash), e não uma vez por linha.
-- ----------------------------------------------------------------------------
create or replace function public.readable_owner_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select auth.uid() where auth.uid() is not null
  union
  select h.owner_id
    from public.household_members h
   where h.member_id = auth.uid()
     and h.status = 'active';
$fn$;

create or replace function public.writable_owner_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select auth.uid() where auth.uid() is not null
  union
  select h.owner_id
    from public.household_members h
   where h.member_id = auth.uid()
     and h.status = 'active'
     and h.role = 'editor';
$fn$;

-- Versões escalares, para checagem explícita dentro das RPCs e das functions.
create or replace function public.can_read(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select p_owner is not null and auth.uid() is not null and (
    p_owner = auth.uid()
    or exists (
      select 1 from public.household_members h
       where h.owner_id  = p_owner
         and h.member_id = auth.uid()
         and h.status    = 'active'
    )
  );
$fn$;

create or replace function public.can_write(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select p_owner is not null and auth.uid() is not null and (
    p_owner = auth.uid()
    or exists (
      select 1 from public.household_members h
       where h.owner_id  = p_owner
         and h.member_id = auth.uid()
         and h.status    = 'active'
         and h.role      = 'editor'
    )
  );
$fn$;

revoke all on function public.readable_owner_ids() from public, anon;
revoke all on function public.writable_owner_ids() from public, anon;
revoke all on function public.can_read(uuid)       from public, anon;
revoke all on function public.can_write(uuid)      from public, anon;
grant execute on function public.readable_owner_ids() to authenticated, service_role;
grant execute on function public.writable_owner_ids() to authenticated, service_role;
grant execute on function public.can_read(uuid)       to authenticated, service_role;
grant execute on function public.can_write(uuid)      to authenticated, service_role;

-- ----------------------------------------------------------------------------
--  Ninguém troca o dono de uma linha.
--
--  A RLS sozinha não fecha isto: quem escreve no caderno alheio e também tem o
--  próprio passaria nas duas checagens de um `update set user_id = eu`, roubando
--  o gasto. Policy não enxerga o valor antigo; trigger enxerga.
-- ----------------------------------------------------------------------------
create or replace function public.forbid_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'Não é permitido transferir o registro para outro dono'
      using errcode = '42501';
  end if;
  return new;
end;
$fn$;

do $own$
declare
  t text;
begin
  foreach t in array array['categories', 'expenses', 'budgets', 'receipts', 'expense_items'] loop
    execute format('drop trigger if exists %1$s_owner_lock on public.%1$s;', t);
    execute format(
      'create trigger %1$s_owner_lock before update on public.%1$s
         for each row execute function public.forbid_owner_change();', t);
  end loop;
end $own$;

-- ----------------------------------------------------------------------------
--  RLS do caderno compartilhado (substitui os loops de policy lá de cima).
--  `user_settings` fica de fora de propósito: "ocultar valor" é preferência de
--  quem está olhando, não do dono do caderno.
-- ----------------------------------------------------------------------------
do $share$
declare
  t text;
begin
  foreach t in array array['categories', 'expenses', 'budgets', 'receipts', 'expense_items'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$s;', t);

    execute format($p$
      create policy "%1$s_select" on public.%1$s for select to authenticated
        using (user_id in (select public.readable_owner_ids()));$p$, t);
    execute format($p$
      create policy "%1$s_insert" on public.%1$s for insert to authenticated
        with check (user_id in (select public.writable_owner_ids()));$p$, t);
    execute format($p$
      create policy "%1$s_update" on public.%1$s for update to authenticated
        using      (user_id in (select public.writable_owner_ids()))
        with check (user_id in (select public.writable_owner_ids()));$p$, t);
    execute format($p$
      create policy "%1$s_delete" on public.%1$s for delete to authenticated
        using (user_id in (select public.writable_owner_ids()));$p$, t);
  end loop;
end $share$;

-- Preferências seguem estritamente pessoais.
drop policy if exists "user_settings_select" on public.user_settings;
drop policy if exists "user_settings_insert" on public.user_settings;
drop policy if exists "user_settings_update" on public.user_settings;
drop policy if exists "user_settings_delete" on public.user_settings;
create policy "user_settings_select" on public.user_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_settings_insert" on public.user_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "user_settings_update" on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_settings_delete" on public.user_settings for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
--  RLS da própria tabela de membros: SÓ LEITURA.
--
--  Sem policy de insert/update/delete, toda mudança passa pelas RPCs abaixo. É
--  isso que impede um convidado de se promover a `editor` com um PATCH direto —
--  o `with check` da RLS não consegue comparar o valor novo com o antigo.
--
--  Convite pendente não aparece para o convidado (`member_id` ainda é nulo e o
--  e-mail não entra na policy): ninguém varre a tabela por e-mail.
-- ----------------------------------------------------------------------------
alter table public.household_members enable row level security;

drop policy if exists "household_members_select" on public.household_members;
create policy "household_members_select" on public.household_members for select to authenticated
  using (owner_id = (select auth.uid()) or member_id = (select auth.uid()));

revoke insert, update, delete on public.household_members from anon, authenticated;

-- ----------------------------------------------------------------------------
--  Storage: a pasta continua sendo a do DONO (`receipts/{owner_id}/...`), o que
--  mantém válidos os caminhos já gravados. Quem manda na pasta agora é a
--  participação no caderno, não a igualdade com auth.uid(). A comparação é
--  feita em texto: converter a pasta para uuid derrubaria a avaliação da policy
--  em qualquer objeto cujo primeiro segmento não seja um uuid.
-- ----------------------------------------------------------------------------
do $stg$
declare
  op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists "receipts_own_%s" on storage.objects;', op);
    execute format('drop policy if exists "receipts_shared_%s" on storage.objects;', op);
  end loop;
end $stg$;

create policy "receipts_shared_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (select o::text from public.readable_owner_ids() o)
  );
create policy "receipts_shared_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (select o::text from public.writable_owner_ids() o)
  );
create policy "receipts_shared_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (select o::text from public.writable_owner_ids() o)
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (select o::text from public.writable_owner_ids() o)
  );
create policy "receipts_shared_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (select o::text from public.writable_owner_ids() o)
  );

-- ============================================================================
--  RPCs do convite.
--  Todas SECURITY DEFINER: precisam ler `auth.users` (o e-mail verificado) e a
--  tabela de membros não aceita escrita direta.
-- ============================================================================

/** Nome de exibição vindo do Google, quando houver. */
create or replace function public.user_display_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select nullif(btrim(coalesce(
           u.raw_user_meta_data->>'full_name',
           u.raw_user_meta_data->>'name', '')), '')
    from auth.users u where u.id = p_user;
$fn$;

revoke all on function public.user_display_name(uuid) from public, anon, authenticated;

create or replace function public.invite_member(p_email text, p_role text default 'viewer')
returns public.household_members
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  uid           uuid := auth.uid();
  v_email       text := lower(btrim(coalesce(p_email, '')));
  v_role        text := lower(btrim(coalesce(p_role, 'viewer')));
  v_owner_email text;
  v_owner_name  text;
  r public.household_members;
begin
  if uid is null then
    raise exception 'Não autenticado' using errcode = '28000';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido' using errcode = '22023';
  end if;
  if v_role not in ('viewer', 'editor') then
    raise exception 'Papel inválido' using errcode = '22023';
  end if;

  select lower(btrim(u.email)) into v_owner_email from auth.users u where u.id = uid;
  v_owner_name := public.user_display_name(uid);

  -- SQLSTATEs próprios: o app é bilíngue e traduz pelo código, não pela frase.
  if v_email = v_owner_email then
    raise exception 'Você não pode convidar a si mesmo' using errcode = 'MG001';
  end if;

  -- Teto defensivo: "família" não são 200 pessoas lendo o mesmo caderno.
  if (select count(*) from public.household_members
       where owner_id = uid and status <> 'revoked') >= 10 then
    raise exception 'Limite de convites atingido' using errcode = 'MG002';
  end if;

  insert into public.household_members as h
    (owner_id, member_id, invited_email, role, status, owner_email, owner_name)
  values (uid, null, v_email, v_role, 'pending', coalesce(v_owner_email, ''), v_owner_name)
  on conflict (owner_id, invited_email) do update
     set role        = excluded.role,
         -- Reconvidar quem já provou ser dono daquela conta volta a valer na hora.
         status      = case when h.member_id is not null then 'active' else 'pending' end,
         accepted_at = case when h.member_id is not null
                            then coalesce(h.accepted_at, now()) else null end,
         owner_email = excluded.owner_email,
         owner_name  = excluded.owner_name,
         revoked_at  = null
  returning * into r;

  return r;
end;
$fn$;

create or replace function public.set_member_role(p_id uuid, p_role text)
returns public.household_members
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_role text := lower(btrim(coalesce(p_role, '')));
  r public.household_members;
begin
  if v_role not in ('viewer', 'editor') then
    raise exception 'Papel inválido' using errcode = '22023';
  end if;

  update public.household_members
     set role = v_role
   where id = p_id
     and owner_id = auth.uid()      -- só o dono muda papel; nunca o convidado
     and status <> 'revoked'
  returning * into r;

  if not found then
    raise exception 'Convite não encontrado' using errcode = 'P0002';
  end if;
  return r;
end;
$fn$;

create or replace function public.revoke_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  -- Mantém `member_id`: reconvidar a mesma pessoa volta a valer na hora, e o
  -- índice único (owner_id, member_id) continua apontando para esta linha.
  update public.household_members
     set status = 'revoked', revoked_at = now()
   where id = p_id and owner_id = auth.uid();

  if not found then
    raise exception 'Convite não encontrado' using errcode = 'P0002';
  end if;
end;
$fn$;

/** O convidado sai por conta própria. Não pode ser um UPDATE liberado por RLS:
    com policy de update ele mudaria `role` no mesmo comando. */
create or replace function public.leave_household(p_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  update public.household_members
     set status = 'revoked', revoked_at = now()
   where owner_id = p_owner_id
     and member_id = auth.uid()
     and status = 'active';
end;
$fn$;

/**
 * Liga os convites pendentes ao e-mail verificado de quem acabou de entrar.
 * É este ponto — e só ele — que transforma um convite em acesso.
 */
create or replace function public.claim_household_invites()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  uid     uuid := auth.uid();
  v_email text;
  v_name  text;
  n       int  := 0;
begin
  if uid is null then return 0; end if;

  -- E-mail verificado. No login com Google o Supabase já grava
  -- `email_confirmed_at`; sem isso, convite nenhum é reivindicado — é o que
  -- impede alguém criar conta com o e-mail alheio e capturar o acesso.
  select lower(btrim(u.email)) into v_email
    from auth.users u
   where u.id = uid and u.email_confirmed_at is not null;

  if v_email is null or v_email = '' then return 0; end if;
  v_name := public.user_display_name(uid);

  -- Convidada em dois e-mails para o mesmo caderno: descarta o pendente extra
  -- em vez de estourar o índice único no update abaixo.
  delete from public.household_members d
   where d.invited_email = v_email
     and d.member_id is null
     and d.status = 'pending'
     and exists (select 1 from public.household_members h
                  where h.owner_id = d.owner_id and h.member_id = uid);

  with claimed as (
    update public.household_members h
       set member_id   = uid,
           member_name = coalesce(v_name, h.member_name),
           status      = 'active',
           accepted_at = now(),
           revoked_at  = null
     where h.invited_email = v_email
       and h.member_id is null
       and h.status   = 'pending'
       and h.owner_id <> uid
    returning 1
  )
  select count(*) into n from claimed;

  return n;
end;
$fn$;

revoke all on function public.invite_member(text, text)   from public, anon;
revoke all on function public.set_member_role(uuid, text) from public, anon;
revoke all on function public.revoke_member(uuid)         from public, anon;
revoke all on function public.leave_household(uuid)       from public, anon;
revoke all on function public.claim_household_invites()   from public, anon;
grant execute on function public.invite_member(text, text)   to authenticated;
grant execute on function public.set_member_role(uuid, text) to authenticated;
grant execute on function public.revoke_member(uuid)         to authenticated;
grant execute on function public.leave_household(uuid)       to authenticated;
grant execute on function public.claim_household_invites()   to authenticated;

-- ============================================================================
--  RPCs existentes: agora precisam saber de QUAL caderno estão falando.
-- ============================================================================

-- Sem o DROP, o `create` abaixo vira uma SEGUNDA função (a assinatura mudou) e
-- o PostgREST passa a recusar a chamada antiga por ambiguidade (PGRST203).
drop function if exists public.save_expense_with_items(jsonb, jsonb, uuid, uuid);

create or replace function public.save_expense_with_items(
  p_expense    jsonb,
  p_items      jsonb default '[]'::jsonb,
  p_receipt_id uuid    default null,
  p_expense_id uuid    default null,
  p_owner_id   uuid    default null   -- nulo = meu próprio caderno
)
returns public.expenses
language plpgsql
as $fn$
declare
  e       public.expenses;
  uid     uuid := auth.uid();
  v_owner uuid := coalesce(p_owner_id, auth.uid());
begin
  if uid is null then
    raise exception 'Não autenticado' using errcode = '28000';
  end if;
  if not public.can_write(v_owner) then
    raise exception 'Sem permissão para escrever neste caderno' using errcode = '42501';
  end if;

  if p_expense_id is null then
    insert into public.expenses (user_id, amount, note, category_id, subcategory_id, occurred_at)
    values (
      v_owner,
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
      and user_id = v_owner      -- o gasto tem que ser do caderno pedido
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
    v_owner,
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
     where id = p_receipt_id
       and user_id = v_owner;
  end if;

  return e;
end;
$fn$;

-- Grava o OCR no caderno do DONO da notinha, e só se quem chamou pode escrever
-- nele. Sem a checagem, um `viewer` recebia "sucesso" para um update que a RLS
-- tinha descartado em silêncio.
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
  if not public.can_write(r.user_id) then
    raise exception 'Sem permissão para escrever neste caderno' using errcode = '42501';
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

-- Descartar notinha de caderno alheio agora falha alto, em vez de apagar zero
-- linhas e a tela dizer que deu certo.
create or replace function public.discard_receipt(p_receipt_id uuid)
returns void
language plpgsql
as $fn$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.receipts where id = p_receipt_id;
  if not found then return; end if;
  if not public.can_write(v_owner) then
    raise exception 'Sem permissão para escrever neste caderno' using errcode = '42501';
  end if;

  delete from public.expense_items
   where receipt_id = p_receipt_id and expense_id is null;
  delete from public.receipts where id = p_receipt_id;
end;
$fn$;

-- ----------------------------------------------------------------------------
--  Realtime: aceite e revogação de convite aparecem na hora nas duas pontas.
-- ----------------------------------------------------------------------------
do $rtm$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'household_members'
  ) then
    alter publication supabase_realtime add table public.household_members;
  end if;
end $rtm$;
