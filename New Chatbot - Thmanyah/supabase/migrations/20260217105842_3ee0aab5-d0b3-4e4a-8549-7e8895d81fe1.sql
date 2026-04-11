
CREATE TABLE public.query_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  document_source TEXT,
  access_tier TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;

-- Allow edge function (service role) to insert
CREATE POLICY "Service role can insert query logs"
  ON public.query_logs FOR INSERT
  WITH CHECK (true);

-- Allow edge function (service role) to select
CREATE POLICY "Service role can select query logs"
  ON public.query_logs FOR SELECT
  USING (true);
