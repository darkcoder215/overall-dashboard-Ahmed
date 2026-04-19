-- =====================================================================
-- Commentator Analysis Tool — dedicated schema
--
-- Stores AI-generated commentary analysis reports produced by
-- tools/commentator. The tool is a vanilla HTML/JS static page; reports
-- are written from the browser via the Supabase anon key, so RLS
-- controls who can read/write.
--
-- Shape notes:
--   * `report` is the full JSON document returned by OpenRouter
--     (match_info, commentator, overall, categories, key_moments,
--      strengths, improvements, transcription, performance_stats,
--      notable_quotes, excitement_timeline, tags). Stored as JSONB so
--     future additions don't require new columns.
--   * Top-level columns mirror the fields the dashboard filters on
--     (search, score buckets, date ranges, role, channel) so queries
--     stay indexable.
-- =====================================================================

create schema if not exists commentator;

-- Reports written by the commentator tool. One row per analysis.
create table if not exists commentator.reports (
  id               uuid primary key default gen_random_uuid(),
  commentator_name text not null,
  role             text not null default 'معلق',
  channel          text,
  team_a           text,
  team_b           text,
  match_score      text,
  competition      text,
  match_date       date,
  overall_score    int  not null check (overall_score between 0 and 100),
  rating           text,
  video_url        text,
  comments         text,
  tags             text[] default '{}',
  report           jsonb not null,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table commentator.reports is
  'Commentator Analysis Tool: AI-generated analysis reports. One row per analysis run.';

-- Keep updated_at in sync on UPDATE.
create or replace function commentator.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = commentator, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_reports_touch_updated_at on commentator.reports;
create trigger trg_reports_touch_updated_at
  before update on commentator.reports
  for each row execute function commentator.touch_updated_at();

-- ── Indexes for the dashboard's filters ────────────────────────────────
create index if not exists idx_reports_match_date
  on commentator.reports (match_date desc);

create index if not exists idx_reports_created_at
  on commentator.reports (created_at desc);

create index if not exists idx_reports_commentator_name
  on commentator.reports (commentator_name);

create index if not exists idx_reports_role
  on commentator.reports (role);

create index if not exists idx_reports_overall_score
  on commentator.reports (overall_score);

create index if not exists idx_reports_channel
  on commentator.reports (channel);

-- ── RLS ───────────────────────────────────────────────────────────────
alter table commentator.reports enable row level security;

-- Read: any authenticated user can read every report. Anonymous users
-- (the unified dashboard's offline/iframe mode when REQUIRE_AUTH=false)
-- can also read so the static demo still works.
drop policy if exists reports_select on commentator.reports;
create policy reports_select on commentator.reports
  for select
  to anon, authenticated
  using (true);

-- Insert: any visitor can save a new report. The browser only has the
-- publishable key, and there is no per-user concept in the commentator
-- tool itself. `created_by` is filled in automatically if a session
-- happens to be present.
drop policy if exists reports_insert on commentator.reports;
create policy reports_insert on commentator.reports
  for insert
  to anon, authenticated
  with check (true);

-- Update / Delete: only the original creator (when authed) or a
-- dashboard admin. Anon users can never modify existing rows.
drop policy if exists reports_update on commentator.reports;
create policy reports_update on commentator.reports
  for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    created_by = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists reports_delete on commentator.reports;
create policy reports_delete on commentator.reports
  for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- ── Expose the schema to PostgREST ────────────────────────────────────
-- The Supabase REST gateway only surfaces schemas that are both (a)
-- listed on `pgrst.db_schemas` for the `authenticator` role, and (b)
-- `USAGE`-grantable to anon/authenticated. Mirrors what
-- `20260411190100_tool_schemas_anon_access.sql` did for the other tool
-- schemas.
alter role authenticator set pgrst.db_schemas to
  'public, chatbot, social_listening, podcast_video, hr_approval, feedback, commentator';
notify pgrst, 'reload config';

grant usage on schema commentator to anon, authenticated;
grant select, insert on commentator.reports to anon;
grant select, insert, update, delete on commentator.reports to authenticated;
grant usage, select on all sequences in schema commentator to anon, authenticated;
alter default privileges in schema commentator
  grant select, insert on tables to anon;
alter default privileges in schema commentator
  grant select, insert, update, delete on tables to authenticated;
grant execute on function commentator.touch_updated_at() to anon, authenticated;
