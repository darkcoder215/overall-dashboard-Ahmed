-- Reflected schema for the "New Chatbot - Thmanyah" tool.
-- Mirrors the end-state of the source migrations into an isolated `chatbot` schema
-- so the unified dashboard project can join against it without polluting `public`.
--
-- Source: New Chatbot - Thmanyah/supabase/migrations/*.sql (6 files)
-- NOTE: Storage bucket `documents` must be created manually by the operator.
-- NOTE: All auth.uid() references are wrapped in (select auth.uid()) per Supabase best practice.

create schema if not exists chatbot;
grant usage on schema chatbot to authenticated;

-- Required extensions (kept in the `extensions` schema, never public)
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists chatbot.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text not null,
  file_path text not null,
  access_tier text not null default 'public',
  metadata jsonb default '{}'::jsonb,
  sections jsonb default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chatbot.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references chatbot.documents(id) on delete cascade,
  content text not null,
  section_title text,
  chunk_index integer not null,
  embedding extensions.vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chatbot.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  access_tier text not null default 'public',
  created_at timestamptz not null default now()
);

create table if not exists chatbot.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chatbot.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  citations jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chatbot.structured_datasets (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references chatbot.documents(id) on delete cascade,
  description text not null,
  columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chatbot.structured_rows (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references chatbot.structured_datasets(id) on delete cascade,
  row_data jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_structured_rows_search
  on chatbot.structured_rows
  using gin (search_text extensions.gin_trgm_ops);

create table if not exists chatbot.query_logs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  document_source text,
  access_tier text not null default 'public',
  created_at timestamptz not null default now()
);

create table if not exists chatbot.app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  display_name text not null,
  role text not null default 'general',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table chatbot.documents          enable row level security;
alter table chatbot.document_chunks    enable row level security;
alter table chatbot.conversations      enable row level security;
alter table chatbot.messages           enable row level security;
alter table chatbot.structured_datasets enable row level security;
alter table chatbot.structured_rows     enable row level security;
alter table chatbot.query_logs          enable row level security;
alter table chatbot.app_users           enable row level security;

-- documents: open read/write to authenticated (source allowed anyone, tier is
-- filtered in the edge function). We narrow to authenticated for safety in the
-- unified project.
drop policy if exists "documents_select" on chatbot.documents;
create policy "documents_select" on chatbot.documents
  for select to authenticated using (true);

drop policy if exists "documents_insert" on chatbot.documents;
create policy "documents_insert" on chatbot.documents
  for insert to authenticated with check (true);

drop policy if exists "documents_update" on chatbot.documents;
create policy "documents_update" on chatbot.documents
  for update to authenticated using (true) with check (true);

drop policy if exists "documents_delete" on chatbot.documents;
create policy "documents_delete" on chatbot.documents
  for delete to authenticated using (true);

-- document_chunks
drop policy if exists "document_chunks_select" on chatbot.document_chunks;
create policy "document_chunks_select" on chatbot.document_chunks
  for select to authenticated using (true);

drop policy if exists "document_chunks_insert" on chatbot.document_chunks;
create policy "document_chunks_insert" on chatbot.document_chunks
  for insert to authenticated with check (true);

-- conversations / messages: authenticated full access (source allowed all)
drop policy if exists "conversations_all" on chatbot.conversations;
create policy "conversations_all" on chatbot.conversations
  for all to authenticated using (true) with check (true);

drop policy if exists "messages_all" on chatbot.messages;
create policy "messages_all" on chatbot.messages
  for all to authenticated using (true) with check (true);

-- structured_datasets
drop policy if exists "structured_datasets_select" on chatbot.structured_datasets;
create policy "structured_datasets_select" on chatbot.structured_datasets
  for select to authenticated using (true);

drop policy if exists "structured_datasets_insert" on chatbot.structured_datasets;
create policy "structured_datasets_insert" on chatbot.structured_datasets
  for insert to authenticated with check (true);

drop policy if exists "structured_datasets_delete" on chatbot.structured_datasets;
create policy "structured_datasets_delete" on chatbot.structured_datasets
  for delete to authenticated using (true);

-- structured_rows
drop policy if exists "structured_rows_select" on chatbot.structured_rows;
create policy "structured_rows_select" on chatbot.structured_rows
  for select to authenticated using (true);

drop policy if exists "structured_rows_insert" on chatbot.structured_rows;
create policy "structured_rows_insert" on chatbot.structured_rows
  for insert to authenticated with check (true);

drop policy if exists "structured_rows_delete" on chatbot.structured_rows;
create policy "structured_rows_delete" on chatbot.structured_rows
  for delete to authenticated using (true);

-- query_logs: admin-only read; inserts allowed to authenticated (edge function
-- uses service role which bypasses RLS anyway)
drop policy if exists "query_logs_admin_select" on chatbot.query_logs;
create policy "query_logs_admin_select" on chatbot.query_logs
  for select to authenticated using (public.is_admin());

drop policy if exists "query_logs_insert" on chatbot.query_logs;
create policy "query_logs_insert" on chatbot.query_logs
  for insert to authenticated with check (true);

-- app_users: admin-only (source table had RLS enabled with no permissive
-- policies -- only service role could touch it). We allow admins via is_admin().
drop policy if exists "app_users_admin_all" on chatbot.app_users;
create policy "app_users_admin_all" on chatbot.app_users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function chatbot.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  allowed_tiers text[] default array['public']
)
returns table (
  id uuid,
  content text,
  section_title text,
  document_title text,
  document_id uuid,
  similarity float
)
language sql
stable
security invoker
set search_path = chatbot, extensions, public
as $$
  select
    dc.id,
    dc.content,
    dc.section_title,
    d.title as document_title,
    dc.document_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  from chatbot.document_chunks dc
  join chatbot.documents d on d.id = dc.document_id
  where d.access_tier = any(allowed_tiers)
    and d.status = 'processed'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function chatbot.fuzzy_search_structured(
  search_query text,
  max_results integer default 10
)
returns table (
  id uuid,
  dataset_id uuid,
  row_data jsonb,
  search_text text,
  description text,
  columns jsonb,
  similarity real
)
language sql
stable
security invoker
set search_path = chatbot, extensions, public
as $$
  select
    sr.id,
    sr.dataset_id,
    sr.row_data,
    sr.search_text,
    sd.description,
    sd.columns,
    extensions.similarity(sr.search_text, search_query) as similarity
  from chatbot.structured_rows sr
  join chatbot.structured_datasets sd on sd.id = sr.dataset_id
  where sr.search_text operator(extensions.%) search_query
     or sr.search_text ilike '%' || search_query || '%'
  order by extensions.similarity(sr.search_text, search_query) desc
  limit max_results;
$$;
