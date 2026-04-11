-- ============================================================
-- Grant anon role access to the tool-specific schemas
--
-- Why this exists:
--   The HR Approval, Podcast & Video, and Feedback Platform tools
--   are embedded inside iframes under the unified dashboard. They
--   don't currently have their own Supabase auth flow — they ship
--   with hard-coded user lists (HR Approval) or anonymous guest
--   access (Podcast & Video, Feedback Platform), and they talk to
--   the DB through the publishable (anon) key.
--
--   The previous RLS policies required the `authenticated` role and
--   a JWT `email` claim, so every query from the tools failed with
--   `permission denied for schema ...`. This migration adds parallel
--   anon policies so each tool can read/write its own data directly
--   using the public anon key.
--
--   The dashboard itself remains gated by the existing public.*
--   policies (tools / profiles / audit_logs). Only the per-tool
--   schemas (hr_approval, podcast_video, feedback) are loosened —
--   no global relaxation.
--
-- Security note:
--   Anon writes are intentional for these internal tools while the
--   team is still wiring per-tool sign-in. Rotating the publishable
--   key or tightening the policies to `authenticated` is a single
--   migration away once each tool has its own auth screen.
-- ============================================================

-- ---------------------------------------------------------------------------
-- Expose the tool schemas to PostgREST so the embedded iframe apps
-- can query `hr_approval.*`, `podcast_video.*`, `feedback.*` directly
-- through the public anon key. Without this, PostgREST only surfaces
-- the `public` schema and all queries from the tools return
-- `The schema must be one of the following: public`.
--
-- `alter role ... set pgrst.db_schemas ...` writes the setting into
-- the role's session config; `notify pgrst` triggers a live reload
-- so the change takes effect without a project restart.
-- ---------------------------------------------------------------------------
alter role authenticator set pgrst.db_schemas to 'public, chatbot, social_listening, podcast_video, hr_approval, feedback';
notify pgrst, 'reload config';

-- ---------------------------------------------------------------------------
-- Schema usage grants (anon must USE the schema before it can see tables)
-- ---------------------------------------------------------------------------
grant usage on schema hr_approval  to anon;
grant usage on schema podcast_video to anon;
grant usage on schema feedback      to anon;

grant select, insert, update, delete on all tables in schema hr_approval  to anon;
grant select, insert, update, delete on all tables in schema podcast_video to anon;
grant select, insert, update, delete on all tables in schema feedback      to anon;

grant usage, select on all sequences in schema hr_approval  to anon;
grant usage, select on all sequences in schema podcast_video to anon;
grant usage, select on all sequences in schema feedback      to anon;

-- Keep future tables accessible by default (saves having to re-run
-- a grant every time a new migration adds a table).
alter default privileges in schema hr_approval
  grant select, insert, update, delete on tables to anon;
alter default privileges in schema podcast_video
  grant select, insert, update, delete on tables to anon;
alter default privileges in schema feedback
  grant select, insert, update, delete on tables to anon;

-- ---------------------------------------------------------------------------
-- HR Approval — permissive anon policies
-- ---------------------------------------------------------------------------
drop policy if exists "vacancy_requests_anon_all" on hr_approval.vacancy_requests;
create policy "vacancy_requests_anon_all"
  on hr_approval.vacancy_requests for all
  to anon
  using (true)
  with check (true);

drop policy if exists "approval_steps_anon_all" on hr_approval.approval_steps;
create policy "approval_steps_anon_all"
  on hr_approval.approval_steps for all
  to anon
  using (true)
  with check (true);

drop policy if exists "ai_analyses_anon_all" on hr_approval.ai_analyses;
create policy "ai_analyses_anon_all"
  on hr_approval.ai_analyses for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Podcast & Video — permissive anon policies
-- ---------------------------------------------------------------------------
drop policy if exists "podcasts_anon_all" on podcast_video.podcasts;
create policy "podcasts_anon_all"
  on podcast_video.podcasts for all
  to anon
  using (true)
  with check (true);

drop policy if exists "scenes_anon_all" on podcast_video.scenes;
create policy "scenes_anon_all"
  on podcast_video.scenes for all
  to anon
  using (true)
  with check (true);

drop policy if exists "scene_embeddings_anon_all" on podcast_video.scene_embeddings;
create policy "scene_embeddings_anon_all"
  on podcast_video.scene_embeddings for all
  to anon
  using (true)
  with check (true);

drop policy if exists "pipeline_jobs_anon_all" on podcast_video.pipeline_jobs;
create policy "pipeline_jobs_anon_all"
  on podcast_video.pipeline_jobs for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Feedback — permissive anon policies
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'employees','evaluations','performance_reviews','leader_evaluations',
      'station_meetings','retention_flags','leader_analyses','uploads'
    ])
  loop
    execute format('drop policy if exists "%I_anon_all" on feedback.%I', t, t);
    execute format(
      'create policy "%I_anon_all" on feedback.%I for all to anon using (true) with check (true)',
      t, t
    );
  end loop;
end
$$;
