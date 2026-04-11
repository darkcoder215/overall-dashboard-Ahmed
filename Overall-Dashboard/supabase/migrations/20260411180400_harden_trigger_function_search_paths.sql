-- Pin search_path on the two trigger functions created for the new
-- schemas (hr_approval + feedback) to satisfy Supabase's
-- `function_search_path_mutable` linter.

create or replace function hr_approval.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = hr_approval, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function feedback.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = feedback, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
