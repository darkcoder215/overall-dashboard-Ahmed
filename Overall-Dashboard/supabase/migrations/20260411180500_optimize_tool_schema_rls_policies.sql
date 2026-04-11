-- ============================================================
-- Optimise RLS policies on the three new tool schemas.
--
-- Fixes two advisor warnings:
--   1. auth_rls_initplan            — wrap auth.jwt() in (select ...) so the
--                                     subplan is hoisted once per query rather
--                                     than re-evaluated per row.
--   2. multiple_permissive_policies — split "FOR ALL" admin-write policies
--                                     into explicit INSERT/UPDATE/DELETE
--                                     policies so they do not overlap with the
--                                     SELECT read policies.
-- ============================================================

-- -- podcast_video --
drop policy if exists "podcasts_write_admin"         on podcast_video.podcasts;
drop policy if exists "scenes_write_admin"           on podcast_video.scenes;
drop policy if exists "scene_embeddings_write_admin" on podcast_video.scene_embeddings;
drop policy if exists "pipeline_jobs_write_admin"    on podcast_video.pipeline_jobs;

create policy "podcasts_insert_admin" on podcast_video.podcasts
  for insert to authenticated with check ((select public.is_admin()));
create policy "podcasts_update_admin" on podcast_video.podcasts
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "podcasts_delete_admin" on podcast_video.podcasts
  for delete to authenticated using ((select public.is_admin()));

create policy "scenes_insert_admin" on podcast_video.scenes
  for insert to authenticated with check ((select public.is_admin()));
create policy "scenes_update_admin" on podcast_video.scenes
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "scenes_delete_admin" on podcast_video.scenes
  for delete to authenticated using ((select public.is_admin()));

create policy "scene_embeddings_insert_admin" on podcast_video.scene_embeddings
  for insert to authenticated with check ((select public.is_admin()));
create policy "scene_embeddings_update_admin" on podcast_video.scene_embeddings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "scene_embeddings_delete_admin" on podcast_video.scene_embeddings
  for delete to authenticated using ((select public.is_admin()));

create policy "pipeline_jobs_insert_admin" on podcast_video.pipeline_jobs
  for insert to authenticated with check ((select public.is_admin()));
create policy "pipeline_jobs_update_admin" on podcast_video.pipeline_jobs
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "pipeline_jobs_delete_admin" on podcast_video.pipeline_jobs
  for delete to authenticated using ((select public.is_admin()));

-- -- hr_approval --
drop policy if exists "vacancy_requests_select_own_or_admin" on hr_approval.vacancy_requests;
drop policy if exists "vacancy_requests_insert_self"         on hr_approval.vacancy_requests;
drop policy if exists "vacancy_requests_update_own_or_admin" on hr_approval.vacancy_requests;
drop policy if exists "vacancy_requests_delete_admin"        on hr_approval.vacancy_requests;
drop policy if exists "approval_steps_select_via_request"    on hr_approval.approval_steps;
drop policy if exists "approval_steps_write_admin"           on hr_approval.approval_steps;
drop policy if exists "ai_analyses_select_via_request"       on hr_approval.ai_analyses;
drop policy if exists "ai_analyses_write_admin"              on hr_approval.ai_analyses;

create policy "vacancy_requests_select_own_or_admin"
  on hr_approval.vacancy_requests for select
  to authenticated
  using (
    (select public.is_admin())
    or requester_email = ((select auth.jwt()) ->> 'email')
  );

create policy "vacancy_requests_insert_self"
  on hr_approval.vacancy_requests for insert
  to authenticated
  with check (
    (select public.is_admin())
    or requester_email = ((select auth.jwt()) ->> 'email')
  );

create policy "vacancy_requests_update_own_or_admin"
  on hr_approval.vacancy_requests for update
  to authenticated
  using (
    (select public.is_admin())
    or requester_email = ((select auth.jwt()) ->> 'email')
  )
  with check (
    (select public.is_admin())
    or requester_email = ((select auth.jwt()) ->> 'email')
  );

create policy "vacancy_requests_delete_admin"
  on hr_approval.vacancy_requests for delete
  to authenticated
  using ((select public.is_admin()));

create policy "approval_steps_select_via_request"
  on hr_approval.approval_steps for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from hr_approval.vacancy_requests r
      where r.id = approval_steps.request_id
        and r.requester_email = ((select auth.jwt()) ->> 'email')
    )
    or approver_email = ((select auth.jwt()) ->> 'email')
  );

create policy "approval_steps_insert_admin" on hr_approval.approval_steps
  for insert to authenticated with check ((select public.is_admin()));
create policy "approval_steps_update_admin" on hr_approval.approval_steps
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "approval_steps_delete_admin" on hr_approval.approval_steps
  for delete to authenticated using ((select public.is_admin()));

create policy "ai_analyses_select_via_request"
  on hr_approval.ai_analyses for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from hr_approval.vacancy_requests r
      where r.id = ai_analyses.request_id
        and r.requester_email = ((select auth.jwt()) ->> 'email')
    )
  );

create policy "ai_analyses_insert_admin" on hr_approval.ai_analyses
  for insert to authenticated with check ((select public.is_admin()));
create policy "ai_analyses_update_admin" on hr_approval.ai_analyses
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "ai_analyses_delete_admin" on hr_approval.ai_analyses
  for delete to authenticated using ((select public.is_admin()));

-- -- feedback --
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
    -- Drop the old FOR ALL write policy that overlapped with select
    execute format('drop policy if exists "%I_write_admin" on feedback.%I', t, t);

    -- Split into INSERT / UPDATE / DELETE, admins only
    execute format(
      'create policy "%I_insert_admin" on feedback.%I for insert to authenticated with check ((select public.is_admin()))',
      t, t
    );
    execute format(
      'create policy "%I_update_admin" on feedback.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t, t
    );
    execute format(
      'create policy "%I_delete_admin" on feedback.%I for delete to authenticated using ((select public.is_admin()))',
      t, t
    );
  end loop;
end
$$;
