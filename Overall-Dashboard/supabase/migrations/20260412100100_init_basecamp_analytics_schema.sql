-- =====================================================================
-- Basecamp Analytics Schema
-- Comprehensive tracking of member activity from Basecamp 3 API
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS basecamp_analytics;

-- ── Basecamp Account Configuration ──────────────────────────────────
CREATE TABLE basecamp_analytics.accounts (
  id             BIGINT PRIMARY KEY,
  name           TEXT NOT NULL,
  product        TEXT,
  href           TEXT,
  app_url        TEXT,
  access_token   TEXT,            -- OAuth Bearer token (encrypted at rest by Supabase)
  refresh_token  TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ── People / Members ────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.people (
  id                   BIGINT PRIMARY KEY,
  account_id           BIGINT REFERENCES basecamp_analytics.accounts(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  email_address        TEXT,
  personable_type      TEXT,                -- User, Client, DummyUser
  title                TEXT,                -- job title
  bio                  TEXT,
  location             TEXT,
  avatar_url           TEXT,
  admin                BOOLEAN DEFAULT FALSE,
  owner                BOOLEAN DEFAULT FALSE,
  client               BOOLEAN DEFAULT FALSE,
  employee             BOOLEAN DEFAULT FALSE,
  time_zone            TEXT,
  company_id           BIGINT,
  company_name         TEXT,
  can_manage_projects  BOOLEAN DEFAULT FALSE,
  can_manage_people    BOOLEAN DEFAULT FALSE,
  can_access_timesheet BOOLEAN DEFAULT FALSE,
  out_of_office        JSONB,               -- {start_date, end_date}
  last_active_at       TIMESTAMPTZ,         -- derived from most recent event
  basecamp_created_at  TIMESTAMPTZ,
  basecamp_updated_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_people_account ON basecamp_analytics.people(account_id);
CREATE INDEX idx_people_email   ON basecamp_analytics.people(email_address);
CREATE INDEX idx_people_active  ON basecamp_analytics.people(last_active_at DESC NULLS LAST);

-- ── Projects ────────────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.projects (
  id                BIGINT PRIMARY KEY,
  account_id        BIGINT REFERENCES basecamp_analytics.accounts(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  purpose           TEXT,
  status            TEXT DEFAULT 'active',    -- active, archived, trashed
  clients_enabled   BOOLEAN DEFAULT FALSE,
  bookmarked        BOOLEAN DEFAULT FALSE,
  color             TEXT,
  url               TEXT,
  app_url           TEXT,
  dock              JSONB,                    -- array of enabled tools
  basecamp_created_at TIMESTAMPTZ,
  basecamp_updated_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_account ON basecamp_analytics.projects(account_id);
CREATE INDEX idx_projects_status  ON basecamp_analytics.projects(status);

-- ── Project Memberships ─────────────────────────────────────────────
CREATE TABLE basecamp_analytics.project_memberships (
  id          BIGSERIAL PRIMARY KEY,
  project_id  BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  person_id   BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, person_id)
);
CREATE INDEX idx_memberships_person  ON basecamp_analytics.project_memberships(person_id);
CREATE INDEX idx_memberships_project ON basecamp_analytics.project_memberships(project_id);

-- ── Events / Activity Log ───────────────────────────────────────────
CREATE TABLE basecamp_analytics.events (
  id              BIGINT PRIMARY KEY,
  account_id      BIGINT REFERENCES basecamp_analytics.accounts(id) ON DELETE CASCADE,
  recording_id    BIGINT,
  bucket_id       BIGINT,          -- project id
  creator_id      BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,    -- created, updated, completed, archived, etc.
  details         JSONB,
  recording_type  TEXT,             -- Todo, Message, Comment, etc.
  recording_title TEXT,
  bucket_name     TEXT,
  created_at      TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_events_account    ON basecamp_analytics.events(account_id);
CREATE INDEX idx_events_creator    ON basecamp_analytics.events(creator_id);
CREATE INDEX idx_events_created    ON basecamp_analytics.events(created_at DESC);
CREATE INDEX idx_events_bucket     ON basecamp_analytics.events(bucket_id);
CREATE INDEX idx_events_type       ON basecamp_analytics.events(recording_type);

-- ── Messages ────────────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.messages (
  id              BIGINT PRIMARY KEY,
  project_id      BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id      BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  message_board_id BIGINT,
  subject         TEXT,
  content         TEXT,
  category        TEXT,
  comments_count  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_messages_project ON basecamp_analytics.messages(project_id);
CREATE INDEX idx_messages_creator ON basecamp_analytics.messages(creator_id);

-- ── To-dos ──────────────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.todos (
  id              BIGINT PRIMARY KEY,
  project_id      BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id      BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  todolist_id     BIGINT,
  todolist_name   TEXT,
  content         TEXT,
  description     TEXT,
  completed       BOOLEAN DEFAULT FALSE,
  completer_id    BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ,
  due_on          DATE,
  starts_on       DATE,
  assignee_ids    BIGINT[],         -- array of person IDs
  status          TEXT DEFAULT 'active',
  comments_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_todos_project   ON basecamp_analytics.todos(project_id);
CREATE INDEX idx_todos_creator   ON basecamp_analytics.todos(creator_id);
CREATE INDEX idx_todos_completed ON basecamp_analytics.todos(completed);
CREATE INDEX idx_todos_assignees ON basecamp_analytics.todos USING GIN(assignee_ids);
CREATE INDEX idx_todos_due       ON basecamp_analytics.todos(due_on) WHERE due_on IS NOT NULL;

-- ── Comments ────────────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.comments (
  id              BIGINT PRIMARY KEY,
  project_id      BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id      BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  recording_id    BIGINT,
  recording_type  TEXT,
  content         TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_comments_project ON basecamp_analytics.comments(project_id);
CREATE INDEX idx_comments_creator ON basecamp_analytics.comments(creator_id);

-- ── Campfire Lines (Chat) ───────────────────────────────────────────
CREATE TABLE basecamp_analytics.campfire_lines (
  id          BIGINT PRIMARY KEY,
  project_id  BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  campfire_id BIGINT,
  creator_id  BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  body        TEXT,
  line_type   TEXT,          -- Chat::Lines::Text, Chat::Lines::RichText
  created_at  TIMESTAMPTZ
);
CREATE INDEX idx_campfire_project ON basecamp_analytics.campfire_lines(project_id);
CREATE INDEX idx_campfire_creator ON basecamp_analytics.campfire_lines(creator_id);
CREATE INDEX idx_campfire_date    ON basecamp_analytics.campfire_lines(created_at DESC);

-- ── Documents ───────────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.documents (
  id          BIGINT PRIMARY KEY,
  project_id  BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id  BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  title       TEXT,
  content     TEXT,
  status      TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
);
CREATE INDEX idx_documents_project ON basecamp_analytics.documents(project_id);
CREATE INDEX idx_documents_creator ON basecamp_analytics.documents(creator_id);

-- ── Uploads (Files) ─────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.uploads (
  id            BIGINT PRIMARY KEY,
  project_id    BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id    BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  filename      TEXT,
  content_type  TEXT,
  byte_size     BIGINT,
  description   TEXT,
  download_url  TEXT,
  width         INTEGER,
  height        INTEGER,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
);
CREATE INDEX idx_uploads_project ON basecamp_analytics.uploads(project_id);
CREATE INDEX idx_uploads_creator ON basecamp_analytics.uploads(creator_id);

-- ── Schedule Entries ────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.schedule_entries (
  id              BIGINT PRIMARY KEY,
  project_id      BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id      BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  summary         TEXT,
  description     TEXT,
  all_day         BOOLEAN DEFAULT FALSE,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  participant_ids BIGINT[],
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_schedule_project      ON basecamp_analytics.schedule_entries(project_id);
CREATE INDEX idx_schedule_creator      ON basecamp_analytics.schedule_entries(creator_id);
CREATE INDEX idx_schedule_starts       ON basecamp_analytics.schedule_entries(starts_at);
CREATE INDEX idx_schedule_participants ON basecamp_analytics.schedule_entries USING GIN(participant_ids);

-- ── Question Answers (Check-ins) ────────────────────────────────────
CREATE TABLE basecamp_analytics.question_answers (
  id            BIGINT PRIMARY KEY,
  project_id    BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  question_id   BIGINT,
  question_title TEXT,
  creator_id    BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  content       TEXT,
  group_on      DATE,
  created_at    TIMESTAMPTZ
);
CREATE INDEX idx_qanswers_project  ON basecamp_analytics.question_answers(project_id);
CREATE INDEX idx_qanswers_creator  ON basecamp_analytics.question_answers(creator_id);
CREATE INDEX idx_qanswers_question ON basecamp_analytics.question_answers(question_id);

-- ── Forwards (Email) ────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.forwards (
  id          BIGINT PRIMARY KEY,
  project_id  BIGINT REFERENCES basecamp_analytics.projects(id) ON DELETE CASCADE,
  creator_id  BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  subject     TEXT,
  from_email  TEXT,
  content     TEXT,
  created_at  TIMESTAMPTZ
);
CREATE INDEX idx_forwards_project ON basecamp_analytics.forwards(project_id);
CREATE INDEX idx_forwards_creator ON basecamp_analytics.forwards(creator_id);

-- ── Boosts (Reactions) ──────────────────────────────────────────────
CREATE TABLE basecamp_analytics.boosts (
  id            BIGINT PRIMARY KEY,
  recording_id  BIGINT,
  booster_id    BIGINT REFERENCES basecamp_analytics.people(id) ON DELETE SET NULL,
  content       TEXT,        -- emoji or reaction text
  created_at    TIMESTAMPTZ
);
CREATE INDEX idx_boosts_booster ON basecamp_analytics.boosts(booster_id);

-- ── Sync Log ────────────────────────────────────────────────────────
CREATE TABLE basecamp_analytics.sync_log (
  id              BIGSERIAL PRIMARY KEY,
  account_id      BIGINT REFERENCES basecamp_analytics.accounts(id) ON DELETE CASCADE,
  sync_type       TEXT NOT NULL,      -- full, incremental, people, projects, etc.
  status          TEXT DEFAULT 'running', -- running, completed, failed
  records_synced  INTEGER DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_sync_account ON basecamp_analytics.sync_log(account_id);
CREATE INDEX idx_sync_started ON basecamp_analytics.sync_log(started_at DESC);

-- ── Activity Summary (Materialized per-person stats) ────────────────
-- Refreshed by the sync engine after each sync run.
CREATE TABLE basecamp_analytics.person_stats (
  person_id         BIGINT PRIMARY KEY REFERENCES basecamp_analytics.people(id) ON DELETE CASCADE,
  total_projects    INTEGER DEFAULT 0,
  total_messages    INTEGER DEFAULT 0,
  total_todos_created    INTEGER DEFAULT 0,
  total_todos_completed  INTEGER DEFAULT 0,
  total_todos_assigned   INTEGER DEFAULT 0,
  total_comments    INTEGER DEFAULT 0,
  total_campfire_lines   INTEGER DEFAULT 0,
  total_documents   INTEGER DEFAULT 0,
  total_uploads     INTEGER DEFAULT 0,
  total_schedule_entries INTEGER DEFAULT 0,
  total_checkin_answers  INTEGER DEFAULT 0,
  total_forwards    INTEGER DEFAULT 0,
  total_boosts      INTEGER DEFAULT 0,
  total_events      INTEGER DEFAULT 0,
  last_active_at    TIMESTAMPTZ,
  computed_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Updated-at trigger ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION basecamp_analytics.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = basecamp_analytics, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON basecamp_analytics.accounts
  FOR EACH ROW EXECUTE FUNCTION basecamp_analytics.set_updated_at();
CREATE TRIGGER trg_people_updated BEFORE UPDATE ON basecamp_analytics.people
  FOR EACH ROW EXECUTE FUNCTION basecamp_analytics.set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON basecamp_analytics.projects
  FOR EACH ROW EXECUTE FUNCTION basecamp_analytics.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────
ALTER TABLE basecamp_analytics.accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.people            ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.todos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.campfire_lines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.uploads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.schedule_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.question_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.forwards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.boosts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.sync_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE basecamp_analytics.person_stats      ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user can read all basecamp analytics data
CREATE POLICY "authenticated_read" ON basecamp_analytics.accounts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.people
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.project_memberships
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.todos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.campfire_lines
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.uploads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.schedule_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.question_answers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.forwards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.boosts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.sync_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON basecamp_analytics.person_stats
  FOR SELECT TO authenticated USING (true);

-- Write: admin only (uses the public.is_admin() helper from existing migrations)
CREATE POLICY "admin_insert" ON basecamp_analytics.accounts
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.accounts
  FOR UPDATE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "admin_delete" ON basecamp_analytics.accounts
  FOR DELETE TO authenticated USING ((select public.is_admin()));

CREATE POLICY "admin_insert" ON basecamp_analytics.people
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.people
  FOR UPDATE TO authenticated USING ((select public.is_admin()));

CREATE POLICY "admin_insert" ON basecamp_analytics.projects
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.projects
  FOR UPDATE TO authenticated USING ((select public.is_admin()));

CREATE POLICY "admin_insert" ON basecamp_analytics.project_memberships
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_delete" ON basecamp_analytics.project_memberships
  FOR DELETE TO authenticated USING ((select public.is_admin()));

CREATE POLICY "admin_insert" ON basecamp_analytics.events
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.messages
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.messages
  FOR UPDATE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.todos
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.todos
  FOR UPDATE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.comments
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.campfire_lines
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.documents
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.documents
  FOR UPDATE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.uploads
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.schedule_entries
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.schedule_entries
  FOR UPDATE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.question_answers
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.forwards
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.boosts
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.sync_log
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.sync_log
  FOR UPDATE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "admin_insert" ON basecamp_analytics.person_stats
  FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "admin_update" ON basecamp_analytics.person_stats
  FOR UPDATE TO authenticated USING ((select public.is_admin()));

-- Anon read access for the tool running in the dashboard iframe
CREATE POLICY "anon_read" ON basecamp_analytics.people
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.projects
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.project_memberships
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.events
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.person_stats
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.accounts
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.messages
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.todos
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.comments
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.campfire_lines
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.documents
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.uploads
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.schedule_entries
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.question_answers
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.forwards
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.boosts
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.sync_log
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON basecamp_analytics.person_stats
  FOR SELECT TO anon USING (true);

-- ── Seed the tool into the dashboard registry ───────────────────────
INSERT INTO public.tools (slug, name_ar, name_en, description_ar, description_en, category, icon, url, position, enabled)
VALUES (
  'basecamp-analytics',
  'تحليلات بيسكامب',
  'Basecamp Analytics',
  'تتبّع وتحليل نشاط أعضاء الفريق في بيسكامب — المشاريع، المحادثات، المهام، والتفاعل.',
  'Track and analyze team member activity in Basecamp — projects, conversations, tasks, and engagement.',
  'analytics',
  'tent',
  '/basecamp-analytics/',
  70,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  url = EXCLUDED.url,
  position = EXCLUDED.position;
