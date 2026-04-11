-- Persistence schema for the Podcast & Video Analysis Platform tool.
-- Mirrors the in-memory data model in
--   Podcast & Video Analysis Platform/src/lib/store.ts
-- so that when the tool is migrated off its Next.js in-memory store it
-- can read/write through @supabase/supabase-js against an isolated
-- `podcast_video` schema (instead of polluting `public`).
--
-- Design notes:
--   * Uses pgvector for scene embeddings (dimension 1536, same as OpenAI
--     text-embedding-3-small and the chatbot schema).
--   * RLS allows any authenticated dashboard user to read; inserts/updates
--     are restricted to admins via public.is_admin() — the tool is
--     producer-facing, not end-user.
--   * Pipeline status and metrics are denormalised onto the podcast row
--     because the Next.js store treats them as part of the podcast record.
--   * Scenes reference podcasts; embeddings reference scenes.

create schema if not exists podcast_video;
grant usage on schema podcast_video to authenticated;

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Podcasts (the top-level media unit)
-- ---------------------------------------------------------------------------
create table if not exists podcast_video.podcasts (
  id               text primary key,
  title            text not null,
  description      text,
  duration         text,
  upload_date      date not null default (now() at time zone 'utc')::date,
  status           text not null default 'processing'
                     check (status in ('processing','ready','error')),
  thumbnail_url    text,
  scenes_count     integer not null default 0,
  source           text not null
                     check (source in ('upload','transcript','video-url')),
  raw_transcript   text,
  video_url        text,
  main_themes      text[] default '{}',
  key_takeaways    text[] default '{}',
  enriched_description text,
  pipeline_status  jsonb default '{}'::jsonb,
  scene_metrics    jsonb default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table podcast_video.podcasts is
  'Canonical podcast/video record. Mirrors the Podcast type + PodcastData from the Next.js tool''s in-memory store.';

-- ---------------------------------------------------------------------------
-- Scenes (segmented excerpts within a podcast)
-- ---------------------------------------------------------------------------
create table if not exists podcast_video.scenes (
  id          text primary key,
  podcast_id  text not null references podcast_video.podcasts(id) on delete cascade,
  title       text not null,
  start_time  text not null,
  end_time    text not null,
  content     text not null,
  summary     text,
  topics      text[] default '{}',
  mood        text,
  "order"     integer not null default 0,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table podcast_video.scenes is
  'Segmented scenes within a podcast, with optional enriched metadata (keywords, entities, sentiment).';

create index if not exists scenes_podcast_id_idx on podcast_video.scenes(podcast_id);
create index if not exists scenes_order_idx      on podcast_video.scenes(podcast_id, "order");

-- ---------------------------------------------------------------------------
-- Scene embeddings (RAG search)
-- ---------------------------------------------------------------------------
create table if not exists podcast_video.scene_embeddings (
  id          uuid primary key default gen_random_uuid(),
  scene_id    text not null references podcast_video.scenes(id) on delete cascade,
  podcast_id  text not null references podcast_video.podcasts(id) on delete cascade,
  embedding   extensions.vector(1536),
  text        text not null,
  created_at  timestamptz not null default now()
);

comment on table podcast_video.scene_embeddings is
  '1536-d embedding vectors for semantic search across scenes. Populated by the enrichment pipeline.';

create index if not exists scene_embeddings_scene_id_idx   on podcast_video.scene_embeddings(scene_id);
create index if not exists scene_embeddings_podcast_id_idx on podcast_video.scene_embeddings(podcast_id);

-- ---------------------------------------------------------------------------
-- Pipeline jobs (audit trail of transcription/segmentation/enrichment runs)
-- ---------------------------------------------------------------------------
create table if not exists podcast_video.pipeline_jobs (
  id          uuid primary key default gen_random_uuid(),
  podcast_id  text not null references podcast_video.podcasts(id) on delete cascade,
  stage       text not null
                check (stage in ('transcribing','segmenting','enriching','embedding','complete','error')),
  progress    integer not null default 0,
  message     text,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists pipeline_jobs_podcast_id_idx on podcast_video.pipeline_jobs(podcast_id);
create index if not exists pipeline_jobs_created_at_idx on podcast_video.pipeline_jobs(created_at desc);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table podcast_video.podcasts        enable row level security;
alter table podcast_video.scenes          enable row level security;
alter table podcast_video.scene_embeddings enable row level security;
alter table podcast_video.pipeline_jobs   enable row level security;

-- Read access: any authenticated dashboard user
create policy "podcasts_select_authenticated"
  on podcast_video.podcasts for select
  to authenticated
  using (true);

create policy "scenes_select_authenticated"
  on podcast_video.scenes for select
  to authenticated
  using (true);

create policy "scene_embeddings_select_authenticated"
  on podcast_video.scene_embeddings for select
  to authenticated
  using (true);

create policy "pipeline_jobs_select_authenticated"
  on podcast_video.pipeline_jobs for select
  to authenticated
  using (true);

-- Write access: admins only
create policy "podcasts_write_admin"
  on podcast_video.podcasts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "scenes_write_admin"
  on podcast_video.scenes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "scene_embeddings_write_admin"
  on podcast_video.scene_embeddings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "pipeline_jobs_write_admin"
  on podcast_video.pipeline_jobs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Table-level grants (RLS still enforced on top)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on podcast_video.podcasts         to authenticated;
grant select, insert, update, delete on podcast_video.scenes           to authenticated;
grant select, insert, update, delete on podcast_video.scene_embeddings to authenticated;
grant select, insert, update, delete on podcast_video.pipeline_jobs    to authenticated;
