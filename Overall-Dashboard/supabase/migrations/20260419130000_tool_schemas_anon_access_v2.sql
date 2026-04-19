-- =====================================================================
-- Tool schemas — anon role access (v2, adds chatbot + social_listening + commentator)
--
-- The original `20260411190100_tool_schemas_anon_access.sql` was never
-- applied to the live DB, which left the Vite + Next tools unable to
-- read/write their schemas from the browser (the publishable/anon key
-- is what ships with the static builds). This migration is the one
-- that actually runs against the live project and also extends the
-- grants to every tool schema we now ship — including the new
-- commentator schema.
-- =====================================================================

alter role authenticator set pgrst.db_schemas to
  'public, chatbot, social_listening, podcast_video, hr_approval, feedback, commentator';
notify pgrst, 'reload config';

grant usage on schema hr_approval       to anon;
grant usage on schema podcast_video     to anon;
grant usage on schema feedback          to anon;
grant usage on schema chatbot           to anon;
grant usage on schema social_listening  to anon;

grant select, insert, update, delete on all tables in schema hr_approval      to anon;
grant select, insert, update, delete on all tables in schema podcast_video    to anon;
grant select, insert, update, delete on all tables in schema feedback         to anon;
grant select, insert, update, delete on all tables in schema chatbot          to anon;
grant select, insert, update, delete on all tables in schema social_listening to anon;

grant usage, select on all sequences in schema hr_approval      to anon;
grant usage, select on all sequences in schema podcast_video    to anon;
grant usage, select on all sequences in schema feedback         to anon;
grant usage, select on all sequences in schema chatbot          to anon;
grant usage, select on all sequences in schema social_listening to anon;

alter default privileges in schema hr_approval      grant select, insert, update, delete on tables to anon;
alter default privileges in schema podcast_video    grant select, insert, update, delete on tables to anon;
alter default privileges in schema feedback         grant select, insert, update, delete on tables to anon;
alter default privileges in schema chatbot          grant select, insert, update, delete on tables to anon;
alter default privileges in schema social_listening grant select, insert, update, delete on tables to anon;

-- Podcast & Video
drop policy if exists "podcasts_anon_all" on podcast_video.podcasts;
create policy "podcasts_anon_all" on podcast_video.podcasts for all to anon using (true) with check (true);
drop policy if exists "scenes_anon_all" on podcast_video.scenes;
create policy "scenes_anon_all" on podcast_video.scenes for all to anon using (true) with check (true);
drop policy if exists "scene_embeddings_anon_all" on podcast_video.scene_embeddings;
create policy "scene_embeddings_anon_all" on podcast_video.scene_embeddings for all to anon using (true) with check (true);
drop policy if exists "pipeline_jobs_anon_all" on podcast_video.pipeline_jobs;
create policy "pipeline_jobs_anon_all" on podcast_video.pipeline_jobs for all to anon using (true) with check (true);

-- HR Approval
drop policy if exists "vacancy_requests_anon_all" on hr_approval.vacancy_requests;
create policy "vacancy_requests_anon_all" on hr_approval.vacancy_requests for all to anon using (true) with check (true);
drop policy if exists "approval_steps_anon_all" on hr_approval.approval_steps;
create policy "approval_steps_anon_all" on hr_approval.approval_steps for all to anon using (true) with check (true);
drop policy if exists "ai_analyses_anon_all" on hr_approval.ai_analyses;
create policy "ai_analyses_anon_all" on hr_approval.ai_analyses for all to anon using (true) with check (true);

-- Feedback
do $$ declare t text; begin
  for t in select unnest(array['employees','evaluations','performance_reviews','leader_evaluations','station_meetings','retention_flags','leader_analyses','uploads']) loop
    execute format('drop policy if exists "%I_anon_all" on feedback.%I', t, t);
    execute format('create policy "%I_anon_all" on feedback.%I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;

-- Chatbot
do $$ declare t text; begin
  for t in select unnest(array['documents','document_chunks','conversations','messages','query_logs','structured_datasets','structured_rows','app_users']) loop
    execute format('drop policy if exists "%I_anon_all" on chatbot.%I', t, t);
    execute format('create policy "%I_anon_all" on chatbot.%I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;

-- Social Listening
do $$ declare t text; begin
  for t in select unnest(array['tweet_analyses','commentary_analyses','candidate_searches','candidates','companies']) loop
    execute format('drop policy if exists "%I_anon_all" on social_listening.%I', t, t);
    execute format('create policy "%I_anon_all" on social_listening.%I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;
