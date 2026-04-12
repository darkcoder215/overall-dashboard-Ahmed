
-- Table for structured datasets (Excel imports)
CREATE TABLE public.structured_datasets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  description text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for structured data rows
CREATE TABLE public.structured_rows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id uuid NOT NULL REFERENCES public.structured_datasets(id) ON DELETE CASCADE,
  row_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_text text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.structured_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structured_rows ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read datasets" ON public.structured_datasets FOR SELECT USING (true);
CREATE POLICY "Service can insert datasets" ON public.structured_datasets FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete datasets" ON public.structured_datasets FOR DELETE USING (true);

CREATE POLICY "Anyone can read rows" ON public.structured_rows FOR SELECT USING (true);
CREATE POLICY "Service can insert rows" ON public.structured_rows FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete rows" ON public.structured_rows FOR DELETE USING (true);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for fuzzy text search
CREATE INDEX idx_structured_rows_search ON public.structured_rows USING GIN (search_text gin_trgm_ops);

-- Function for fuzzy search on structured data
CREATE OR REPLACE FUNCTION public.fuzzy_search_structured(
  search_query text,
  max_results integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  dataset_id uuid,
  row_data jsonb,
  search_text text,
  description text,
  columns jsonb,
  similarity real
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    sr.id,
    sr.dataset_id,
    sr.row_data,
    sr.search_text,
    sd.description,
    sd.columns,
    similarity(sr.search_text, search_query) as similarity
  FROM public.structured_rows sr
  JOIN public.structured_datasets sd ON sd.id = sr.dataset_id
  WHERE sr.search_text % search_query
     OR sr.search_text ILIKE '%' || search_query || '%'
  ORDER BY similarity(sr.search_text, search_query) DESC
  LIMIT max_results;
$$;
