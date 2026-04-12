-- Recruitment Intelligence: config table for storing Recruitee API credentials
create table if not exists public.recruitment_config (
  id          uuid primary key default gen_random_uuid(),
  company_id  text not null,
  api_token   text not null,
  company_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only one config row should exist; enforce with a unique partial index
create unique index if not exists recruitment_config_singleton
  on public.recruitment_config ((true));

-- RLS
alter table public.recruitment_config enable row level security;

-- Allow authenticated users to read and write
create policy "Authenticated users can read recruitment_config"
  on public.recruitment_config for select
  to authenticated
  using (true);

create policy "Authenticated users can insert recruitment_config"
  on public.recruitment_config for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update recruitment_config"
  on public.recruitment_config for update
  to authenticated
  using (true)
  with check (true);

-- Allow anon access too (for unauthenticated dashboard usage)
create policy "Anon users can read recruitment_config"
  on public.recruitment_config for select
  to anon
  using (true);

create policy "Anon users can insert recruitment_config"
  on public.recruitment_config for insert
  to anon
  with check (true);

create policy "Anon users can update recruitment_config"
  on public.recruitment_config for update
  to anon
  using (true)
  with check (true);

-- Auto-update updated_at on changes
create or replace function public.recruitment_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recruitment_config_set_updated_at
  before update on public.recruitment_config
  for each row
  execute function public.recruitment_config_updated_at();
