
-- Fix function search path to include extensions for vector operations
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
security invoker
set search_path = public, extensions
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
