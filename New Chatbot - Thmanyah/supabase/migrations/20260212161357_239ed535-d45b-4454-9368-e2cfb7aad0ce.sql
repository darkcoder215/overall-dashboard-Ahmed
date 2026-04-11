
-- Add delete policy for documents (admin panel needs it)
create policy "Service can delete documents" on public.documents for delete using (true);
-- Cascade delete handles chunks automatically
