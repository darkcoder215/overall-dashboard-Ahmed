-- Reflected schema for the "Social Listening / Data Weaver" tool.
-- Mirrors the end-state of the source migrations into an isolated `social_listening`
-- schema so the unified dashboard project can join against it without polluting
-- `public`.
--
-- Source: Social-Listening---Final-Bassam-claude-debug-blank-page-3cSDv/supabase/migrations/*.sql (16 files)
-- NOTE: No storage buckets referenced.
-- NOTE: auth.users references become plain uuid (no FK); the unified project's
--       on_auth_user_created trigger owns auth.users. All auth.uid() calls are
--       wrapped in (select auth.uid()).

create schema if not exists social_listening;
grant usage on schema social_listening to authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists social_listening.tweet_analyses (
  id uuid primary key default gen_random_uuid(),
  search_terms text[] not null,
  max_items integer not null,
  sort_order text not null,
  total_tweets integer not null default 0,
  positive_count integer not null default 0,
  negative_count integer not null default 0,
  neutral_count integer not null default 0,
  insights text,
  recommendations text,
  sample_tweets jsonb,
  all_tweets jsonb default '[]'::jsonb,
  main_issues text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tweet_analyses_created_at
  on social_listening.tweet_analyses(created_at desc);

create table if not exists social_listening.commentary_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  filename text not null,
  transcription text not null,
  segments jsonb not null default '[]'::jsonb,
  overall_score real not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  excitement_timeline jsonb not null default '[]'::jsonb,
  emotional_analysis jsonb default '{}'::jsonb,
  emotional_timeline jsonb default '[]'::jsonb,
  clarity jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  enthusiasm jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  accuracy jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  timing jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  terminology jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  event_reaction jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  style_variety jsonb default '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_commentary_analyses_user_id
  on social_listening.commentary_analyses(user_id);
create index if not exists idx_commentary_analyses_created_at
  on social_listening.commentary_analyses(created_at desc);

create table if not exists social_listening.candidate_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  job_title text not null,
  city text not null,
  companies text[] default '{}'::text[],
  search_query text not null,
  total_results integer default 0,
  skills text[] default '{}'::text[],
  experience_level text[] default '{}'::text[],
  education text[] default '{}'::text[],
  exclude_terms text[] default '{}'::text[],
  job_titles text[] default '{}'::text[],
  cities text[] default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists idx_candidate_searches_user_id
  on social_listening.candidate_searches(user_id);
create index if not exists idx_candidate_searches_created_at
  on social_listening.candidate_searches(created_at desc);

create table if not exists social_listening.candidates (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references social_listening.candidate_searches(id) on delete cascade,
  user_id uuid,
  name text not null,
  linkedin_url text not null,
  profile_summary text,
  ai_analysis jsonb default '{}'::jsonb,
  status text default 'pending' check (status in ('pending', 'qualified', 'not_qualified')),
  comment text,
  enriched_profile jsonb default null,
  gender text,
  gender_confidence numeric,
  gender_explanation text,
  citizenship text,
  citizenship_confidence numeric,
  citizenship_explanation text,
  overall_relevancy_score integer check (overall_relevancy_score >= 0 and overall_relevancy_score <= 100),
  job_title_relevancy_score integer check (job_title_relevancy_score >= 0 and job_title_relevancy_score <= 100),
  industry_relevancy_score integer check (industry_relevancy_score >= 0 and industry_relevancy_score <= 100),
  years_relevant_experience numeric(4, 1),
  ai_relevancy_analysis jsonb default '{}'::jsonb,
  saved boolean default false,
  qualification_status text check (qualification_status in ('overqualified', 'qualified', 'underqualified', 'pending')),
  total_years_experience numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_candidates_search_id       on social_listening.candidates(search_id);
create index if not exists idx_candidates_user_id         on social_listening.candidates(user_id);
create index if not exists idx_candidates_status          on social_listening.candidates(status);
create index if not exists idx_candidates_overall_relevancy   on social_listening.candidates(overall_relevancy_score);
create index if not exists idx_candidates_job_title_relevancy on social_listening.candidates(job_title_relevancy_score);
create index if not exists idx_candidates_industry_relevancy  on social_listening.candidates(industry_relevancy_score);
create index if not exists idx_candidates_years_experience    on social_listening.candidates(years_relevant_experience);

create table if not exists social_listening.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_name text not null,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, user_id)
);

create index if not exists idx_companies_user_id    on social_listening.companies(user_id);
create index if not exists idx_companies_group_name on social_listening.companies(group_name);

-- ---------------------------------------------------------------------------
-- Functions / triggers
-- ---------------------------------------------------------------------------

create or replace function social_listening.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = social_listening, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_candidates_updated_at on social_listening.candidates;
create trigger update_candidates_updated_at
  before update on social_listening.candidates
  for each row
  execute function social_listening.set_updated_at();

drop trigger if exists update_companies_updated_at on social_listening.companies;
create trigger update_companies_updated_at
  before update on social_listening.companies
  for each row
  execute function social_listening.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table social_listening.tweet_analyses        enable row level security;
alter table social_listening.commentary_analyses   enable row level security;
alter table social_listening.candidate_searches    enable row level security;
alter table social_listening.candidates            enable row level security;
alter table social_listening.companies             enable row level security;

-- tweet_analyses: any authenticated user (source policy)
drop policy if exists "tweet_analyses_select" on social_listening.tweet_analyses;
create policy "tweet_analyses_select" on social_listening.tweet_analyses
  for select to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists "tweet_analyses_insert" on social_listening.tweet_analyses;
create policy "tweet_analyses_insert" on social_listening.tweet_analyses
  for insert to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists "tweet_analyses_update" on social_listening.tweet_analyses;
create policy "tweet_analyses_update" on social_listening.tweet_analyses
  for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "tweet_analyses_delete" on social_listening.tweet_analyses;
create policy "tweet_analyses_delete" on social_listening.tweet_analyses
  for delete to authenticated
  using ((select auth.uid()) is not null);

-- commentary_analyses: owner-only
drop policy if exists "commentary_analyses_select" on social_listening.commentary_analyses;
create policy "commentary_analyses_select" on social_listening.commentary_analyses
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "commentary_analyses_insert" on social_listening.commentary_analyses;
create policy "commentary_analyses_insert" on social_listening.commentary_analyses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "commentary_analyses_delete" on social_listening.commentary_analyses;
create policy "commentary_analyses_delete" on social_listening.commentary_analyses
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- candidate_searches: owner-only
drop policy if exists "candidate_searches_select" on social_listening.candidate_searches;
create policy "candidate_searches_select" on social_listening.candidate_searches
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "candidate_searches_insert" on social_listening.candidate_searches;
create policy "candidate_searches_insert" on social_listening.candidate_searches
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "candidate_searches_delete" on social_listening.candidate_searches;
create policy "candidate_searches_delete" on social_listening.candidate_searches
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- candidates: owner-only
drop policy if exists "candidates_select" on social_listening.candidates;
create policy "candidates_select" on social_listening.candidates
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "candidates_insert" on social_listening.candidates;
create policy "candidates_insert" on social_listening.candidates
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "candidates_update" on social_listening.candidates;
create policy "candidates_update" on social_listening.candidates
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "candidates_delete" on social_listening.candidates;
create policy "candidates_delete" on social_listening.candidates
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- companies: owner-only
drop policy if exists "companies_select" on social_listening.companies;
create policy "companies_select" on social_listening.companies
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "companies_insert" on social_listening.companies;
create policy "companies_insert" on social_listening.companies
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "companies_update" on social_listening.companies;
create policy "companies_update" on social_listening.companies
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "companies_delete" on social_listening.companies;
create policy "companies_delete" on social_listening.companies
  for delete to authenticated
  using ((select auth.uid()) = user_id);
