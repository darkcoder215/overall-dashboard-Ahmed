-- ============================================================
-- Tools revision (2026-04-17)
-- ------------------------------------------------------------
--  1. New `commentator` schema + reports table + storage bucket
--     policy helpers. Lets the Commentator tool persist analysis
--     output server-side instead of keeping it only in the browser.
--  2. Performance indexes the advisor flagged on high-traffic
--     filters (status, season, is_leader, upload_date, JSONB).
--  3. Retire `chatbot.app_users` plaintext password column — any
--     future auth should go through auth.users. The table is kept
--     read-only for legacy exports but INSERT/UPDATE are revoked.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. commentator schema
-- ---------------------------------------------------------------------------
create schema if not exists commentator;

create table if not exists commentator.reports (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  -- Denormalised match metadata so listing queries don't have to
  -- decode the `report` JSONB for every row.
  commentator_name text,
  channel          text,
  match_label      text,
  overall_score    integer check (overall_score between 0 and 100),
  duration_seconds integer,
  audio_path       text,          -- storage path inside `commentator-audio`
  report           jsonb not null default '{}'::jsonb,
  model            text,
  created_at       timestamptz not null default now()
);

comment on table commentator.reports is
  'Persisted output of the Commentator analysis tool. `report` is the raw JSON returned by the model; the top-level columns are denormalised for listing.';

create index if not exists commentator_reports_user_created_idx
  on commentator.reports (user_id, created_at desc);
create index if not exists commentator_reports_created_idx
  on commentator.reports (created_at desc);
create index if not exists commentator_reports_score_idx
  on commentator.reports (overall_score);

alter table commentator.reports enable row level security;

-- RLS: users can only touch their own rows; admins can read everything.
create policy "commentator_reports_select_own"
  on commentator.reports for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "commentator_reports_insert_own"
  on commentator.reports for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "commentator_reports_update_own"
  on commentator.reports for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "commentator_reports_delete_own"
  on commentator.reports for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Expose the schema to PostgREST.
alter role authenticator set pgrst.db_schemas to
  'public, chatbot, social_listening, podcast_video, hr_approval, feedback, commentator';
notify pgrst, 'reload config';

grant usage on schema commentator to authenticated;
grant select, insert, update, delete on commentator.reports to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Missing performance indexes flagged during audit
-- ---------------------------------------------------------------------------
create index if not exists podcasts_status_upload_idx
  on podcast_video.podcasts (status, upload_date desc);

create index if not exists pipeline_jobs_stage_idx
  on podcast_video.pipeline_jobs (podcast_id, stage);

create index if not exists performance_reviews_is_leader_idx
  on feedback.performance_reviews (is_leader);

create index if not exists vacancy_requests_status_created_idx
  on hr_approval.vacancy_requests (status, created_at desc);

-- Trigram index for candidate search substring matches.
create extension if not exists pg_trgm;
create index if not exists candidate_searches_query_trgm_idx
  on social_listening.candidate_searches using gin (search_query extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. Deprecate plaintext password storage
--
--    The `authenticate` edge function compared a client-supplied
--    password to `app_users.password` in plaintext. Switch any
--    future auth to Supabase `auth.users` + `profiles.role`, and
--    lock writes to this table so no new plaintext passwords land.
--    The table stays readable for migration tools but nothing can
--    insert/update/delete without service_role.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'chatbot' and table_name = 'app_users'
  ) then
    revoke insert, update, delete on chatbot.app_users from authenticated, anon;

    -- Drop any existing permissive policies and replace with explicit deny.
    execute 'drop policy if exists "app_users_select_admin" on chatbot.app_users';
    execute 'drop policy if exists "app_users_insert_admin" on chatbot.app_users';
    execute 'drop policy if exists "app_users_update_admin" on chatbot.app_users';
    execute 'drop policy if exists "app_users_delete_admin" on chatbot.app_users';

    execute 'create policy "app_users_select_admin" on chatbot.app_users '
         || 'for select to authenticated using ((select public.is_admin()))';

    comment on table chatbot.app_users is
      'DEPRECATED — do not use for new auth. Plaintext passwords; kept '
      || 'read-only for migration. Use auth.users + public.profiles instead.';
  end if;
end
$$;
