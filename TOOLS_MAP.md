# Thmanyah — Overall Tools Map

This document is the canonical reference for every tool in this monorepo,
how they are built and deployed as a single Vercel site, and the shared
Supabase data model that backs them.

> **One deploy, one origin, six tools.** `bash build.sh` assembles every
> tool into `_site/` and Vercel serves them all under the same origin, so
> the Overall Dashboard can embed them in iframes without CSP headaches.

---

## 1 · Tool Inventory

| # | Tool (folder) | Arabic title | Purpose | Stack | Supabase schema |
|---|---|---|---|---|---|
| 1 | `Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh` | أداة تحليل المعلقين | Football commentary analysis (32 criteria across 8 axes), PDF/Excel export, OpenRouter (Gemini 2.5 Pro) calls. **Reference UI for the whole dashboard.** | Vanilla HTML · CSS · JS | — (client-only) |
| 2 | `Social-Listening---Final-Bassam-claude-debug-blank-page-3cSDv` | أداة الرصد الاجتماعي | Social listening + candidate hunter: tweet/commentary analysis, LinkedIn scraping via Apify, demographics enrichment. | Vite · React · shadcn/ui · TS | `social_listening` |
| 3 | `New Chatbot - Thmanyah` | مساعد ثمانية الذكي | Internal AI assistant (RAG over documents with pgvector). Edge Functions `authenticate`, `chat`, `process-document`. | Vite · React 18 · shadcn/ui · TS | `chatbot` |
| 4 | `Podcast & Video Analysis Platform` | أداة تحليل البودكاست | Podcast / video upload, transcription, scene segmentation, semantic search. | Next.js 14 · React 18 · Tailwind · TS | `podcast_video` |
| 5 | `HR-Approval-Workflow-claude-hiring-approval-framework-5782x` | نموذج طلب فتح شاغر وظيفي | HR hiring-approval workflow: vacancy request, approval chain, OpenRouter analysis. | Next.js 16 · React 19 · Tailwind v4 · TS | `hr_approval` |
| 6 | `Feedback Platform/company-feedback-platform-…-dwcOg` | منصة تحليل التقييمات | Employee reviews, probation evaluations, leader evaluations, retention flags. | Next.js 14 · React 18 · Tailwind · TS | `feedback` |

All tools are Arabic-first (`dir="rtl"`) and share Thmanyah branding.

### Served URLs (same-origin, under the unified deploy)

| Tool | URL path | Build output copied from |
|---|---|---|
| Overall Dashboard | `/` | `Overall-Dashboard/` (static copy) |
| Commentator | `/commentator/` | `Thmanyah-Commentator-Tool-…/` (static copy) |
| Chatbot | `/chatbot/` | `New Chatbot - Thmanyah/dist/` (Vite `BASE_PATH=/chatbot/`) |
| Social Listening | `/social-listening/` | `Social-Listening---Final-Bassam-…/dist/` (Vite `BASE_PATH=/social-listening/`) |
| Podcast & Video | `/podcast-video/` | `Podcast & Video Analysis Platform/out/` (Next `NEXT_EXPORT=1` + `NEXT_BASE_PATH=/podcast-video`) |
| HR Approval | `/hr-approval/` | `HR-Approval-Workflow-…/out/` (Next `NEXT_EXPORT=1` + `NEXT_BASE_PATH=/hr-approval`) |
| Feedback Platform | `/feedback-platform/` | `Feedback Platform/…/out/` (Next `NEXT_EXPORT=1` + `NEXT_BASE_PATH=/feedback-platform`) |

### Per-tool dev commands (for working on a single tool in isolation)

| Tool | Dev command | Default port |
|---|---|---|
| Commentator | open `index.html` (static) | — |
| Social Listening | `npm run dev` (vite) | 8080 |
| Chatbot | `npm run dev` (vite) | 8080 |
| Podcast & Video | `npm run dev` | 3000 |
| HR Approval | `npm run dev` (Next 16 + turbopack) | 3000 |
| Feedback Platform | `npm run dev` | 3000 |
| **Overall Dashboard** | `bash build.sh && npx serve _site` | 3000 |

### Security findings (current state)

1. **OpenRouter keys are no longer in client bundles.** Both Commentator
   (`tools/commentator/app.js`) and Social Listening
   (`tools/social-listening/Data-Weaver/src/lib/ai-analysis.ts`) now call
   Supabase Edge Functions (`commentator-analyze` / `social-listening-analyze`)
   that hold `OPENROUTER_API_KEY` server-side and require a signed-in user.
   Rotate the key in Supabase → Edge Functions → Secrets.
2. **Plaintext passwords in `chatbot.app_users` are deprecated.** The
   `20260417120100_tools_revision…` migration revokes INSERT/UPDATE/DELETE
   on that table from `authenticated`/`anon`. Any future auth must go
   through `auth.users` + `profiles.role`.
3. `.env` / `.env.local` are git-ignored. Each tool needs its env vars set on
   Vercel (publishable key only, never service-role).

---

## 2 · Unified build pipeline (`build.sh` → `_site/`)

The repo root has **one build command** that Vercel runs:

```json
// vercel.json
{
  "buildCommand": "bash build.sh",
  "outputDirectory": "_site",
  "installCommand": "echo 'install handled per-tool by build.sh'",
  "framework": null
}
```

`build.sh` walks through every tool, runs its native build in a **dedicated
subshell**, and copies the resulting static assets into `_site/<slug>/`.
Key properties:

1. **Fault isolation.** `set -u` but **no `set -e`** — a crashing build never
   kills the overall deploy. Failed tools get a placeholder
   `_site/<slug>/index.html` explaining the failure, and the dashboard still
   lists them (iframe just shows the maintenance page).
2. **Per-tool logs** under `_site/_build-logs/<slug>.log` (with
   `X-Robots-Tag: noindex`).
3. **Env toggles.** `SKIP_INSTALL=1` reuses `node_modules`, `ONLY_TOOL=<slug>`
   builds a single tool for local debugging, `VERBOSE=1` streams logs live.
4. **Base-path injection.** Each Vite/Next build gets its served prefix as an
   env var (`BASE_PATH` / `VITE_BASE_PATH` / `NEXT_BASE_PATH`) so assets
   resolve correctly under `/chatbot/`, `/podcast-video/`, etc.
5. **Shared assets.** The dashboard references Thmanyah fonts via relative
   paths like `../Thmanyah-Commentator-Tool-.../Usable/`. `build.sh` ships
   that folder at the expected path so the fonts resolve after flattening.

Resulting layout:

```
_site/
├─ index.html                 # Overall Dashboard launcher
├─ styles.css, app.js, tools.js, config.js
├─ _build-logs/<slug>.log     # noindex, per-tool build output
├─ commentator/
├─ chatbot/
├─ social-listening/
├─ podcast-video/
├─ hr-approval/
├─ feedback-platform/
└─ Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/Usable/…  # shared fonts
```

Because every tool is served from the **same origin** as the dashboard, the
launcher embeds each one in an `<iframe>` without running into
`frame-ancestors`, cross-origin cookies, or Supabase auth silos.

---

## 3 · Overall Dashboard (`/`)

### Goal
A vanilla HTML/CSS/JS launcher that lists every tool as a card, opens it
inside a tabbed iframe shell, and persists favorites / activity to Supabase.

### Layout
```
┌──────────────────────────────────┬────────────┐
│  Top bar (sticky, blurred)       │            │
│  ───────────────────────────────│  SIDEBAR   │
│                                  │  (fixed,   │
│    Hero (gradient, hero-stats)   │   right,   │
│    Launcher grid (tool cards)    │   dark)    │
│                                  │            │
│  (when a tool is open:           │  • Logo    │
│   tabs strip + iframe frames)    │  • Nav     │
│                                  │  • Theme   │
│                                  │  • User    │
└──────────────────────────────────┴────────────┘
```

### Design tokens

| Token | Value |
|---|---|
| Accent (ثمانية) | `#00C17A` |
| Accent (أناناس) | `#FF4D00` |
| Sidebar bg | `#000000` |
| Page bg | `#F7F4EE` |
| Text | `#000000` / `#494C6B` |
| Display font | `Thmanyah Serif Display` |
| UI font | `Thmanyah Sans` |
| Body font | `Thmanyah Serif Text` |
| Sidebar width | `260px` |
| Radius scale | `8 / 12 / 16 / 24 / 9999` |

### Per-tool accent colours
Each card has its own glow colour driven by `TOOL_ACCENTS` in
`Overall-Dashboard/tools.js`:

| Slug | Accent keyword |
|---|---|
| `commentator` | `amber` |
| `chatbot` | `blue` |
| `social-listening` | `peach` |
| `podcast-video` | `red` |
| `hr-approval` | `green` |
| `feedback-platform` | `charcoal` |

### File layout
```
Overall-Dashboard/
├─ index.html          # App shell, views, modals
├─ styles.css          # Hero + tool-card + tabs + theme variables
├─ app.js              # Nav, auth, Supabase client, iframe tab manager
├─ tools.js            # STATIC_TOOLS fallback, ICONS, TOOL_ACCENTS
├─ config.js           # Supabase URL + publishable key + TOOL_URLS map
└─ supabase/migrations # Canonical DB schema (see § 4)
```

### Tool registry shape
```ts
type Tool = {
  slug: string;           // e.g. "commentator"
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  category: 'analytics' | 'hr' | 'content' | 'ai' | 'social' | 'general';
  icon: string;           // Lucide icon name (rendered as inline SVG)
  url: string;            // Same-origin path (e.g. "/chatbot/")
  enabled: boolean;
  position: number;
};
```

### Fallback behaviour
- If `config.js` is missing / unreachable Supabase → `tools.js` `STATIC_TOOLS`
  is used and the dashboard still renders.
- If a tool failed to build → the iframe loads `_site/<slug>/index.html`,
  which is the maintenance placeholder written by `build.sh`.
- Neither failure mode blocks the other five tools.

---

## 4 · Supabase — unified project `hbnvbfcwrfanpayxulih`

A single Supabase project (region `eu-central-1`) backs every tool. Each
tool lives in its **own schema** so the boundary stays clean and
tool-internal PII never leaks into the dashboard layer.

### Schemas

| Schema | Owner tool | Tables | Notes |
|---|---|---|---|
| `public` | Overall Dashboard | `profiles`, `tools`, `tool_favorites`, `audit_logs` | Registry + per-user favorites + open-tool audit trail |
| `chatbot` | New Chatbot | `documents`, `document_chunks`, `conversations`, `messages`, `query_logs`, `structured_datasets`, `structured_rows` | RAG corpus + chat history + structured CSV/Excel uploads |
| `social_listening` | Social Listening | `tweet_analyses`, `commentary_analyses`, `candidate_searches`, `candidates`, `companies`, …  | Tweet / commentary analysis + LinkedIn candidate hunter |
| `podcast_video` | Podcast & Video | `podcasts`, `scenes`, `scene_embeddings` (pgvector 1536-d), `pipeline_jobs` | Segmented scenes with semantic search |
| `hr_approval` | HR Approval | `vacancy_requests`, `approval_steps`, `ai_analyses` | Vacancy requests routed through the approval chain + cached OpenRouter analyses |
| `feedback` | Feedback Platform | `employees`, `evaluations`, `performance_reviews`, `leader_evaluations`, `station_meetings`, `retention_flags`, `leader_analyses`, `uploads` | Probation / Ananas / 360 evaluations + upload audit |

### Migration order (all under `Overall-Dashboard/supabase/migrations/`)

1. `20260411140100_init_profiles_and_role.sql` — `public.profiles` + `is_admin()` helper
2. `20260411140200_init_tools_registry.sql` — `public.tools` + same-origin seed URLs
3. `20260411140300_init_favorites_and_audit.sql` — `public.tool_favorites`, `public.audit_logs`
4. `20260411140400_rls_policies_and_optimization.sql` — RLS + `(select auth.fn())` optimisation
5. `20260411150100_reflect_chatbot_schema.sql` — reflect existing `chatbot` schema
6. `20260411150200_reflect_social_listening_schema.sql` — reflect existing `social_listening` schema
7. `20260411160100_chatbot_fk_indexes.sql` — FK indexes on chatbot fanout tables
8. `20260411180100_init_podcast_video_schema.sql` — **new** `podcast_video`
9. `20260411180200_init_hr_approval_schema.sql` — **new** `hr_approval`
10. `20260411180300_init_feedback_schema.sql` — **new** `feedback`
11. `20260411180400_harden_trigger_function_search_paths.sql` — pin `search_path` on trigger functions
12. `20260411180500_optimize_tool_schema_rls_policies.sql` — split `FOR ALL` admin policies into INSERT/UPDATE/DELETE + lift `auth.jwt()` subselects

### Security best practices applied

1. **RLS on every table** in every schema.
2. **`(select auth.fn())` initplan lifting** on RLS predicates so the auth
   subplan runs once per query, not once per row (`auth_rls_initplan`
   advisor clean).
3. **Explicit INSERT / UPDATE / DELETE policies** — no `FOR ALL` admin-write
   policies overlapping with SELECT reads (`multiple_permissive_policies`
   advisor clean).
4. **`security definer` helper `public.is_admin()`** with
   `set search_path = public, pg_temp` to prevent search-path injection.
5. **Trigger functions pinned** (`set search_path = <schema>, pg_temp`) —
   see `20260411180400_…` (function_search_path_mutable clean).
6. **Tool-internal RLS model:**
   - `public.tools` — any authenticated user can read `enabled = true`; admin
     writes.
   - `public.tool_favorites` / `public.audit_logs` — user can only touch
     their own rows.
   - `chatbot` / `social_listening` — read open to authenticated, write
     scoped via existing tool logic.
   - `podcast_video` — read open to authenticated, write admin-only.
   - `hr_approval` — requesters CRUD their own rows matched on
     `((select auth.jwt()) ->> 'email')`; approvers see rows they're
     assigned to; admin has full access.
   - `feedback` — read open to authenticated, write admin-only.
7. **Publishable (anon) key only in the browser.** The key lives in
   `Overall-Dashboard/config.js`; service-role never ships.
8. **pgvector 1536** for both `chatbot.document_chunks` and
   `podcast_video.scene_embeddings` (OpenAI `text-embedding-3-small`
   compatible).

### Client wiring
Every tool reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(or the Vite equivalent) from its own env. In the unified Vercel deploy, set
them once at the project level and every build inherits them.

---

## 5 · Adding a new tool

The build is manifest-driven now: drop a folder with a `tool.json` into
`tools/` and it gets picked up on the next `build.sh` run. The scaffold
script takes care of the boilerplate.

```bash
scripts/new-tool.sh <slug> <type> "Name EN" "اسم عربي"
# e.g.
scripts/new-tool.sh sponsor-tracker static "Sponsor Tracker" "تتبع الرعاة"
```

1. The script creates `tools/<slug>/tool.json` and, for `static` tools, a
   placeholder `index.html`. For `vite` / `next` tools it creates an
   empty `app/` folder — wire the framework in yourself (reading
   `VITE_BASE_PATH` or `NEXT_BASE_PATH` from the environment).
2. `build.sh validate_manifest` enforces the required fields
   (`slug`, `name`, `type`, plus `buildCmd`+`dist` for non-static tools)
   and smoke-tests the output (`_site/<slug>/index.html` must exist and
   be ≥ 512 B).
3. Register the tool in `Overall-Dashboard/tools.js` `STATIC_TOOLS` and
   `TOOL_ACCENTS` so it shows up before Supabase is reachable.
4. Add a `public.tools` row via a migration so the dashboard's live
   `refreshTools()` call finds it:
   ```sql
   insert into public.tools
     (slug, name_ar, name_en, description_ar, description_en,
      category, icon, url, position)
   values
     ('<slug>', 'اسم عربي', 'Name EN',
      'وصف عربي', 'English description',
      'analytics', 'bar-chart-3', '/<slug>/', 70);
   ```
5. (Optional) Create an isolated schema for the tool's data:
   `Overall-Dashboard/supabase/migrations/YYYYMMDDHHMMSS_init_<slug>_schema.sql`.
6. (Optional) If the tool needs an LLM: add an edge function under
   `Overall-Dashboard/supabase/functions/<slug>-analyze/index.ts` that
   proxies OpenRouter and require a signed-in user — mirror the
   `commentator-analyze` / `social-listening-analyze` functions instead
   of shipping a key in the bundle.
7. Commit + push. Vercel rebuilds everything; the new card appears
   automatically.

---

## 6 · Roadmap

- [x] Centralise OpenRouter / OpenAI calls behind Supabase Edge Functions so
      no tool ships an API key in the browser (Commentator + Social Listening
      done via `commentator-analyze` / `social-listening-analyze`).
- [ ] Move the HR Approval tool's OpenRouter usage behind a matching edge
      function (pattern is now established).
- [ ] `log-tool-open` Edge Function that writes `public.audit_logs` **and**
      issues a signed iframe src — gives per-role auditing for free.
- [ ] Per-role visibility (`allowed_roles text[]` on `public.tools` + RLS)
      so HR tools can be hidden from non-HR users.
- [ ] Global search Edge Function across tool schemas (read-only, RLS-aware).
- [ ] Migrate each Next.js tool from in-memory / localStorage stores to the
      new Supabase schemas (schemas are already in place; the swap is
      client-side only).
