
-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text not null,
  file_path text not null,
  access_tier text not null default 'public',
  metadata jsonb default '{}',
  sections jsonb default '[]',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document chunks with embeddings
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  section_title text,
  chunk_index integer not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Chat conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  access_tier text not null default 'public',
  created_at timestamptz not null default now()
);

-- Chat messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null,
  content text not null,
  citations jsonb default '[]',
  created_at timestamptz not null default now()
);

-- Storage bucket for documents
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- RLS
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Public access policies (access tier filtering done in edge function)
create policy "Anyone can read documents" on public.documents for select using (true);
create policy "Service can insert documents" on public.documents for insert with check (true);
create policy "Service can update documents" on public.documents for update using (true);

create policy "Anyone can read chunks" on public.document_chunks for select using (true);
create policy "Service can insert chunks" on public.document_chunks for insert with check (true);

create policy "Anyone can manage conversations" on public.conversations for all using (true);
create policy "Anyone can manage messages" on public.messages for all using (true);

-- Storage policies
create policy "Anyone can upload documents" on storage.objects for insert with check (bucket_id = 'documents');
create policy "Anyone can read documents" on storage.objects for select using (bucket_id = 'documents');

-- Similarity search function
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
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
language sql stable
as $$
  select
    dc.id,
    dc.content,
    dc.section_title,
    d.title as document_title,
    dc.document_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where d.access_tier = any(allowed_tiers)
    and d.status = 'processed'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
