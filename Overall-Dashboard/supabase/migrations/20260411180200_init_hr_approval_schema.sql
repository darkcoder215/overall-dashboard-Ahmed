-- Persistence schema for the HR Approval Workflow tool.
-- Mirrors the localStorage shape in
--   HR-Approval-Workflow-.../src/lib/types.ts
--   HR-Approval-Workflow-.../src/lib/store.ts
-- so the tool can be swapped from localStorage to Supabase without a
-- data-model redesign.
--
-- Entities:
--   * vacancy_requests  — one row per hiring request
--   * approval_steps    — the per-request approval chain (ordered)
--   * ai_analyses       — results from the /api/analyze endpoint (OpenRouter → structured output)
--
-- RLS model:
--   * requesters can see/edit their own requests (match on requester_email)
--   * approvers see all requests in pending/approval status (app enforces step-level access)
--   * admins (public.is_admin) have full access

create schema if not exists hr_approval;
grant usage on schema hr_approval to authenticated;

-- ---------------------------------------------------------------------------
-- Vacancy requests
-- ---------------------------------------------------------------------------
create table if not exists hr_approval.vacancy_requests (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  status                      text not null default 'received'
                                check (status in ('received','under_review','pending_approval','approved','rejected','hiring_started')),
  current_approval_step       integer not null default 0,

  -- Requester
  requester_name              text not null,
  requester_email             text not null,
  department                  text not null,
  section                     text,
  team                        text,
  project                     text,
  budget_owner                text,

  -- Vacancy core
  vacancy_type                text not null check (vacancy_type in ('replacement','new_position')),
  positions_count             integer not null default 1,

  -- Replacement-specific
  previous_employee_name      text,
  departure_date              date,
  departure_type              text check (departure_type in ('resignation','termination')),
  departure_reason            text,

  -- New-position-specific
  is_in_approved_structure    boolean,
  structure_justification     text,

  -- Role
  job_title                   text not null,
  job_title_en                text,
  job_level                   text,
  role_nature                 text check (role_nature in ('full_time','part_time','contract','freelance','intern')),
  job_description             text,
  country                     text,
  preferred_country           text,
  work_location               text,
  nationality                 text check (nationality in ('saudi','arab','non_arab')),

  -- Assessment
  tried_alternatives          boolean,
  alternatives_description    text,
  risks_if_not_hired          text,

  -- AI assessment (as filled in by the requester)
  ai_role_integration         text,
  ai_automation_potential     text,
  ai_replacement_assessment   text,

  -- Hiring bar
  hiring_bar_commitment       text,

  -- Rejection
  rejection_reason            text
);

comment on table hr_approval.vacancy_requests is
  'Open-vacancy requests routed through the HR approval chain. Replaces the localStorage key "thmanyah_vacancy_requests".';

create index if not exists vacancy_requests_status_idx        on hr_approval.vacancy_requests(status);
create index if not exists vacancy_requests_requester_idx     on hr_approval.vacancy_requests(requester_email);
create index if not exists vacancy_requests_department_idx    on hr_approval.vacancy_requests(department);
create index if not exists vacancy_requests_created_at_idx    on hr_approval.vacancy_requests(created_at desc);

-- ---------------------------------------------------------------------------
-- Approval steps (per-request chain)
-- ---------------------------------------------------------------------------
create table if not exists hr_approval.approval_steps (
  id                uuid primary key default gen_random_uuid(),
  request_id        uuid not null references hr_approval.vacancy_requests(id) on delete cascade,
  step_order        integer not null,
  role              text not null,
  approver_name     text,
  approver_email    text,
  sla_hours         integer not null default 48,
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  comment           text,
  internal_comment  text,
  decided_at        timestamptz,
  reminder_sent_at  timestamptz,
  created_at        timestamptz not null default now(),
  unique (request_id, step_order)
);

comment on table hr_approval.approval_steps is
  'Ordered approval chain for a vacancy request. Index 0 is the budget owner; the final step is typically Culture/CPO.';

create index if not exists approval_steps_request_id_idx on hr_approval.approval_steps(request_id);
create index if not exists approval_steps_approver_idx   on hr_approval.approval_steps(approver_email);

-- ---------------------------------------------------------------------------
-- AI analyses (structured output from OpenRouter via /api/analyze)
-- ---------------------------------------------------------------------------
create table if not exists hr_approval.ai_analyses (
  id                  uuid primary key default gen_random_uuid(),
  request_id          uuid references hr_approval.vacancy_requests(id) on delete cascade,
  overall_score       integer not null check (overall_score between 0 and 100),
  score_label         text not null,
  summary             text,
  dimensions          jsonb not null default '[]'::jsonb,
  strengths           text[] default '{}',
  concerns            text[] default '{}',
  ai_risk_assessment  text,
  budget_consideration text,
  recommendation      text,
  suggested_questions text[] default '{}',
  model               text,
  created_at          timestamptz not null default now()
);

comment on table hr_approval.ai_analyses is
  'Structured AI analysis result for a vacancy request. Produced by the /api/analyze OpenRouter call; cached so repeated reads do not re-burn tokens.';

create index if not exists ai_analyses_request_id_idx on hr_approval.ai_analyses(request_id);

-- ---------------------------------------------------------------------------
-- Auto-update updated_at on vacancy_requests
-- ---------------------------------------------------------------------------
create or replace function hr_approval.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vacancy_requests_touch_updated_at on hr_approval.vacancy_requests;
create trigger vacancy_requests_touch_updated_at
  before update on hr_approval.vacancy_requests
  for each row execute function hr_approval.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table hr_approval.vacancy_requests enable row level security;
alter table hr_approval.approval_steps   enable row level security;
alter table hr_approval.ai_analyses      enable row level security;

-- vacancy_requests: requester can CRUD their own row (matched on JWT email), admins have full access
create policy "vacancy_requests_select_own_or_admin"
  on hr_approval.vacancy_requests for select
  to authenticated
  using (
    public.is_admin()
    or requester_email = (select auth.jwt() ->> 'email')
  );

create policy "vacancy_requests_insert_self"
  on hr_approval.vacancy_requests for insert
  to authenticated
  with check (
    public.is_admin()
    or requester_email = (select auth.jwt() ->> 'email')
  );

create policy "vacancy_requests_update_own_or_admin"
  on hr_approval.vacancy_requests for update
  to authenticated
  using (
    public.is_admin()
    or requester_email = (select auth.jwt() ->> 'email')
  )
  with check (
    public.is_admin()
    or requester_email = (select auth.jwt() ->> 'email')
  );

create policy "vacancy_requests_delete_admin"
  on hr_approval.vacancy_requests for delete
  to authenticated
  using (public.is_admin());

-- approval_steps: joined via request, admin for writes
create policy "approval_steps_select_via_request"
  on hr_approval.approval_steps for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from hr_approval.vacancy_requests r
      where r.id = approval_steps.request_id
        and r.requester_email = (select auth.jwt() ->> 'email')
    )
    or approver_email = (select auth.jwt() ->> 'email')
  );

create policy "approval_steps_write_admin"
  on hr_approval.approval_steps for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ai_analyses: read via parent request, write via admin
create policy "ai_analyses_select_via_request"
  on hr_approval.ai_analyses for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from hr_approval.vacancy_requests r
      where r.id = ai_analyses.request_id
        and r.requester_email = (select auth.jwt() ->> 'email')
    )
  );

create policy "ai_analyses_write_admin"
  on hr_approval.ai_analyses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on hr_approval.vacancy_requests to authenticated;
grant select, insert, update, delete on hr_approval.approval_steps   to authenticated;
grant select, insert, update, delete on hr_approval.ai_analyses      to authenticated;
