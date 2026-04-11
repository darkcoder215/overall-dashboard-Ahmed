-- Persistence schema for the Feedback Analysis Platform tool.
-- Mirrors the TypeScript types in
--   Feedback Platform/.../src/lib/types.ts
-- The tool currently runs entirely client-side — it parses CSV/XLSX files
-- from public/data on load and keeps state in React context. This schema
-- is a future-proof landing zone so the tool can swap to Supabase for
-- cross-session persistence without redesigning the data model.
--
-- Entities:
--   * employees            — one row per employee
--   * evaluations          — probation evaluations (first_impression / midpoint / decision_station)
--   * performance_reviews  — Ananas season reviews
--   * leader_evaluations   — anonymised 360 leader evaluations
--   * station_meetings     — quarterly 1-on-1 records
--   * retention_flags      — non-retention justifications
--   * leader_analyses      — narrative summaries of each leader
--   * uploads              — audit of every raw upload processed into the above tables
--
-- Score blobs are stored as JSONB to match the shape-rich TypeScript types
-- without flattening every sub-metric into its own column.
--
-- RLS model (intentionally conservative because the data is sensitive):
--   * admins (public.is_admin) have full access
--   * authenticated users can read aggregate records
--   * only admins can insert/update/delete

create schema if not exists feedback;
grant usage on schema feedback to authenticated;

-- ---------------------------------------------------------------------------
-- Employees (directory)
-- ---------------------------------------------------------------------------
create table if not exists feedback.employees (
  id                      text primary key,
  name                    text not null,
  preferred_name          text,
  department              text,
  team                    text,
  level                   integer,
  job_title_ar            text,
  job_title_en            text,
  manager                 text,
  office                  text,
  start_date              date,
  current_location        text,
  work_type               text,
  in_probation            boolean default false,
  last_promotion_date     date,
  service_months          integer,
  service_years           numeric(5,2),
  current_contract        text,
  contract_days_remaining integer,
  contract_end_date       date,
  is_leader               boolean default false,
  overall_rating          text,
  gender                  text,
  nationality             text,
  birth_date              date,
  age                     integer,
  phone                   text,
  work_email              text,
  personal_email          text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table feedback.employees is
  'Canonical employee directory used by the Feedback platform. One row per employee (id matches the source CSV employee id).';

create index if not exists feedback_employees_department_idx on feedback.employees(department);
create index if not exists feedback_employees_team_idx       on feedback.employees(team);
create index if not exists feedback_employees_manager_idx    on feedback.employees(manager);

-- ---------------------------------------------------------------------------
-- Probation evaluations
-- ---------------------------------------------------------------------------
create table if not exists feedback.evaluations (
  id                         text primary key,
  submission_id              text,
  submitted_at               timestamptz,
  evaluation_type            text not null
                               check (evaluation_type in ('first_impression','midpoint','decision_station')),
  evaluator_name             text,
  employee_name              text,
  employee_id                text references feedback.employees(id) on delete set null,
  first_impression_scores    jsonb,
  midpoint_scores            jsonb,
  decision_station_scores    jsonb,
  previous_targets           text,
  next_targets               text,
  start_feedback             text,
  stop_feedback              text,
  continue_feedback          text,
  open_comments              text,
  traffic_light              text,
  traffic_light_score        numeric(5,2),
  decision_direction         text,
  final_decision             text,
  additional_notes           text,
  created_at                 timestamptz not null default now()
);

comment on table feedback.evaluations is
  'Three-phase probation evaluations: first impression, midpoint, and decision station. Score bundles live in JSONB to mirror the TypeScript shape.';

create index if not exists feedback_evaluations_employee_id_idx on feedback.evaluations(employee_id);
create index if not exists feedback_evaluations_type_idx        on feedback.evaluations(evaluation_type);

-- ---------------------------------------------------------------------------
-- Performance reviews (Ananas seasons)
-- ---------------------------------------------------------------------------
create table if not exists feedback.performance_reviews (
  id                     text primary key,
  employee_name          text not null,
  employee_id            text references feedback.employees(id) on delete set null,
  direct_leader          text,
  manager_of_manager     text,
  employee_number        text,
  review_number          text,
  station                text,
  general_track          text,
  general_track_score    numeric(6,2),
  general_track_percent  numeric(6,2),
  leadership_track       text,
  leadership_track_score numeric(6,2),
  leadership_percent     numeric(6,2),
  met_expectations       text,
  performance_scores     jsonb,
  performance_comments   jsonb,
  leadership_scores      jsonb,
  review_status          text,
  season                 text,
  review_date            date,
  manager_comments       text,
  hr_comments            text,
  leadership_potential   text,
  retain_employee        text,
  employee_email         text,
  is_leader              boolean default false,
  is_hr_team             boolean default false,
  in_probation           boolean default false,
  review_type            text,
  manager_approval_date  timestamptz,
  hr_approval_date       timestamptz,
  rejection_reason       text,
  report_sent_date       timestamptz,
  department             text,
  job_title              text,
  team                   text,
  level                  integer,
  office                 text,
  current_location       text,
  employment_type        text,
  gender                 text,
  nationality            text,
  join_date              date,
  matched                text,
  created_at             timestamptz not null default now()
);

create index if not exists feedback_reviews_employee_id_idx on feedback.performance_reviews(employee_id);
create index if not exists feedback_reviews_season_idx      on feedback.performance_reviews(season);
create index if not exists feedback_reviews_department_idx  on feedback.performance_reviews(department);

-- ---------------------------------------------------------------------------
-- Leader 360 evaluations
-- ---------------------------------------------------------------------------
create table if not exists feedback.leader_evaluations (
  id                         text primary key,
  submission_id              text,
  submitted_at               timestamptz,
  evaluator_name             text,
  leader_name                text,
  leader_id                  text references feedback.employees(id) on delete set null,
  communication              numeric(5,2),
  prioritization             numeric(5,2),
  decision_making            numeric(5,2),
  goal_setting               numeric(5,2),
  clarity_comments           text,
  empowerment                numeric(5,2),
  delegation                 numeric(5,2),
  support                    numeric(5,2),
  emotional_intelligence     numeric(5,2),
  work_method_comments       text,
  morale                     numeric(5,2),
  collaboration              numeric(5,2),
  environment                numeric(5,2),
  inclusion                  numeric(5,2),
  team_leadership_comments   text,
  development                numeric(5,2),
  feedback                   numeric(5,2),
  performance                numeric(5,2),
  creativity                 numeric(5,2),
  development_comments       text,
  general_comments           text,
  hr_comments                text,
  average_score              numeric(5,2),
  created_at                 timestamptz not null default now()
);

create index if not exists feedback_leader_evaluations_leader_id_idx on feedback.leader_evaluations(leader_id);

-- ---------------------------------------------------------------------------
-- Station meetings (quarterly 1-on-1)
-- ---------------------------------------------------------------------------
create table if not exists feedback.station_meetings (
  id                            text primary key,
  employee_name                 text,
  employee_id                   text references feedback.employees(id) on delete set null,
  employee_email                text,
  is_manager                    boolean default false,
  manager_name                  text,
  season                        text,
  meeting_status                text,
  submission_date               timestamptz,
  approval_date                 timestamptz,
  strengths                     text,
  manager_strength_comments     text,
  development_areas             text,
  manager_development_comments  text,
  future_goals                  text,
  manager_goal_comments         text,
  general_notes                 text,
  manager_general_notes         text,
  core_tasks                    text,
  projects                      text,
  learning_development          text,
  other                         text,
  created_at                    timestamptz not null default now()
);

create index if not exists feedback_station_meetings_employee_id_idx on feedback.station_meetings(employee_id);

-- ---------------------------------------------------------------------------
-- Retention flags
-- ---------------------------------------------------------------------------
create table if not exists feedback.retention_flags (
  id                     text primary key,
  employee_name          text,
  employee_id            text references feedback.employees(id) on delete set null,
  direct_leader          text,
  general_track          text,
  general_track_percent  numeric(6,2),
  leadership_track       text,
  retain_employee        text,
  department             text,
  manager_justification  text,
  created_at             timestamptz not null default now()
);

create index if not exists feedback_retention_flags_employee_id_idx on feedback.retention_flags(employee_id);

-- ---------------------------------------------------------------------------
-- Leader narrative analyses
-- ---------------------------------------------------------------------------
create table if not exists feedback.leader_analyses (
  id              uuid primary key default gen_random_uuid(),
  leader_name     text not null,
  leader_id       text references feedback.employees(id) on delete set null,
  strengths       text,
  weaknesses      text,
  recommendations text,
  ideal_team      text,
  action_steps    text,
  comparison      text,
  created_at      timestamptz not null default now()
);

create index if not exists feedback_leader_analyses_leader_id_idx on feedback.leader_analyses(leader_id);

-- ---------------------------------------------------------------------------
-- Upload audit
-- ---------------------------------------------------------------------------
create table if not exists feedback.uploads (
  id            uuid primary key default gen_random_uuid(),
  file_name     text not null,
  file_type     text not null
                  check (file_type in ('employees','evaluations','reviews','leaders')),
  row_count     integer not null default 0,
  uploaded_by   uuid references auth.users(id) on delete set null,
  uploaded_at   timestamptz not null default now(),
  quality_report jsonb default '{}'::jsonb
);

create index if not exists feedback_uploads_uploaded_by_idx on feedback.uploads(uploaded_by);

-- ---------------------------------------------------------------------------
-- Auto-update updated_at on employees
-- ---------------------------------------------------------------------------
create or replace function feedback.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists employees_touch_updated_at on feedback.employees;
create trigger employees_touch_updated_at
  before update on feedback.employees
  for each row execute function feedback.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table feedback.employees            enable row level security;
alter table feedback.evaluations          enable row level security;
alter table feedback.performance_reviews  enable row level security;
alter table feedback.leader_evaluations   enable row level security;
alter table feedback.station_meetings     enable row level security;
alter table feedback.retention_flags      enable row level security;
alter table feedback.leader_analyses      enable row level security;
alter table feedback.uploads              enable row level security;

-- Read: any authenticated user (the tool itself enforces finer-grained role filters client-side)
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
    execute format(
      'create policy "%I_select_authenticated" on feedback.%I for select to authenticated using (true)',
      t, t
    );
    execute format(
      'create policy "%I_write_admin" on feedback.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on feedback.employees            to authenticated;
grant select, insert, update, delete on feedback.evaluations          to authenticated;
grant select, insert, update, delete on feedback.performance_reviews  to authenticated;
grant select, insert, update, delete on feedback.leader_evaluations   to authenticated;
grant select, insert, update, delete on feedback.station_meetings     to authenticated;
grant select, insert, update, delete on feedback.retention_flags      to authenticated;
grant select, insert, update, delete on feedback.leader_analyses      to authenticated;
grant select, insert, update, delete on feedback.uploads              to authenticated;
