# Thmanyah — Overall Tools Map

This document maps every tool inside this mono‑repo, describes each tool's
purpose, tech stack and entry points, and defines the unified **Overall
Dashboard** that ties them together.

---

## 1 · Tool Inventory

| # | Tool (folder) | Arabic title | Purpose | Stack | Supabase |
|---|---|---|---|---|---|
| 1 | `Feedback Platform/company-feedback-platform-abdulqudoos-claude-feedback-analysis-platform-dwcOg` | منصة تحليل التقييمات | Employee reviews, probation-period evaluations, leader evaluations. Reads Excel/CSV, charts via Recharts + framer-motion, maps via react-simple-maps. | Next.js 14 · React 18 · Tailwind · TS | ✅ (client via `NEXT_PUBLIC_SUPABASE_*`) |
| 2 | `HR-Approval-Workflow-claude-hiring-approval-framework-5782x` | نموذج طلب فتح شاغر وظيفي | HR hiring-approval workflow: request a new job vacancy, route for approvals. | Next.js 16 · React 19 · Tailwind v4 · TS | ✅ (client via `NEXT_PUBLIC_SUPABASE_*`) |
| 3 | `New Chatbot - Thmanyah` | مساعد ثمانية الذكي | Internal AI assistant (RAG over documents with pgvector). 3 Edge Functions: `authenticate`, `chat`, `process-document`. | Vite · React 18 · shadcn/ui · Tailwind · TS | ✅ project `alsncbvxfckpjqnyuetr` · 6 migrations · 3 functions |
| 4 | `Podcast & Video Analysis Platform` | أداة تحليل البودكاست | Podcast / video content analysis (upload, transcript, search). | Next.js 14 · React 18 · Tailwind · TS | ❌ |
| 5 | `Social-Listening---Final-Bassam-claude-debug-blank-page-3cSDv` (Data‑Weaver) | أداة الرصد الاجتماعي | Social listening + candidate hunter: tweet/commentary analysis, LinkedIn scraping via Apify, demographics enrichment. Has Express backend + Drizzle + Passport + OpenAI. | Vite · React · Express · shadcn/ui · Tailwind · TS | ✅ project `jmidpcmotjvyuxsijxsj` · 16 migrations · 6 Edge Functions (`analyze-commentary`, `analyze-tweets`, `search-linkedin-candidates`, `analyze-demographics`, `reanalyze-candidate`, `enrich-candidate`) — all `verify_jwt = true` |
| 6 | `Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh` | أداة تحليل المعلقين | Football commentary analysis (32 criteria across 8 axes), PDF/Excel export, OpenRouter (Gemini 2.5 Pro) calls from the browser. **Its UI is the reference style for the Overall Dashboard.** | Vanilla HTML · CSS · JS | ❌ |

All tools are Arabic-first (`dir="rtl"`) and share Thmanyah branding.

### Entry commands

| Tool | Dev command | Default port |
|---|---|---|
| Feedback Platform | `npm run dev` | 3000 |
| HR Approval | `npm run dev` (Next 16 + turbopack) | 3000 |
| Chatbot | `npm run dev` (vite) | 8080 |
| Podcast & Video | `npm run dev` | 3000 |
| Social Listening / Data‑Weaver | `npm run dev` (vite) | 8080 |
| Commentator Tool | open `index.html` (static) | — |
| **Overall Dashboard** | open `Overall-Dashboard/index.html` (static) | — |

### ⚠ Security findings (pre‑existing, not introduced here)

1. **Commentator Tool – hard-coded OpenRouter API key in `app.js:7`.** Anyone
   viewing `view-source:` can steal it and bill the account. This key should
   be rotated immediately and moved behind a server-side proxy (e.g. a
   Supabase Edge Function that accepts the user's JWT and forwards to
   OpenRouter).
2. **`.env` / `.env.local` files are not committed to the repo**, which is
   correct — but make sure each deployed tool has the right env vars set on
   its hosting platform, and that the publishable (not service-role) key is
   used in the browser.

---

## 2 · Reference UI — "Windows Desktop" layout

The Commentator tool (`Thmanyah-Commentator-Tool-.../index.html`) defines the
app-shell look we replicate across the Overall Dashboard:

```
┌─────────────────────────────────────┬────────────┐
│  Top bar (sticky, blurred)          │            │
│  ───────────────────────────────────│  SIDEBAR   │
│                                     │  (fixed,   │
│    Dash welcome hero (greeting +    │   right,   │
│    primary CTA + circular visual)   │   dark)    │
│                                     │            │
│    Stats row (4 cards)              │  • Logo    │
│                                     │  • Nav     │
│    Section: "Tools" grid            │  • Theme   │
│                                     │  • User    │
│    Section: "How it works"          │            │
└─────────────────────────────────────┴────────────┘
```

### Design tokens (reused verbatim)

| Token | Value |
|---|---|
| Accent (ثمانية) | `#00C17A` |
| Accent (أناناس) | `#FF4D00` |
| Sidebar bg | `#000000` |
| Page bg | `#F7F4EE` (off‑white) |
| Text | `#000000` / `#494C6B` (muted) |
| Display font | `Thmanyah Serif Display` |
| UI font | `Thmanyah Sans` |
| Body font | `Thmanyah Serif Text` |
| Sidebar width | `260px` |
| Radius scale | `8 / 12 / 16 / 24 / 9999` |

### Key components to reuse

| Component | Commentator path | Class names |
|---|---|---|
| Sidebar w/ nav + user footer | `index.html:13-71` | `.sidebar, .sidebar-nav, .nav-item, .nav-item.active` |
| Top bar | `index.html:75-96` | `.top-bar, .page-title, .top-bar-actions` |
| Welcome hero | `index.html:104-126` | `.dash-welcome, .dash-welcome-title, .dash-welcome-desc, .dash-welcome-visual` |
| Stats row (4 cards) | `index.html:128-166` | `.dash-stats-row, .dash-stat-card, .dash-stat-icon, .dash-stat-value` |
| Section + grid | `index.html:168-201` | `.dash-section, .dash-section-title, .dash-steps-grid, .dash-step-card` |
| Theme toggle (ثمانية ⇄ أناناس) | `index.html:48-61` + `app.js:1746-1764` + `styles.css:1350-1395` | `[data-theme="ananas"] .*` |
| Button system | `styles.css:157-176` | `.btn.btn-primary, .btn-secondary, .btn-accent` |

---

## 3 · Overall Dashboard

### Goal
A single landing page that lists **every tool** in this repo as a clickable card,
styled exactly like the Commentator dashboard home view. The dashboard:

1. Reuses the Commentator's visual language (sidebar, tokens, typography).
2. Drives its tool list from a **Supabase `tools` table** so the admin can
   add/edit/disable tools without changing code.
3. Falls back to a **hard-coded static registry** when offline / env missing,
   so the dashboard still works as a pure static site.
4. Supports the same ثمانية ⇄ أناناس theme switcher (persisted in `localStorage`).

### Tech stack
- **Vanilla HTML + CSS + JS** (no build step) — matches the Commentator tool,
  loads in any browser, trivially hostable on Vercel/Netlify/Supabase storage.
- **@supabase/supabase-js** via CDN for auth + table reads.
- Fonts reused from `Thmanyah-Commentator-Tool-.../Usable/`.

### File layout
```
Overall-Dashboard/
├─ index.html          # App shell + dashboard view
├─ styles.css          # Subset of Commentator styles + dashboard-specific tweaks
├─ app.js              # Navigation, theme, Supabase client, tool registry loader
├─ tools.js            # Static fallback tool registry (6 tools)
└─ config.example.js   # Supabase URL / publishable key template
```

The static `tools.js` mirrors the `tools` table so the dashboard always renders.

### Tool registry schema (also used as the static object shape)
```ts
type Tool = {
  slug: string;          // e.g. "commentator"
  name_ar: string;       // Arabic display name
  name_en: string;       // English display name
  description_ar: string;// One‑line description
  category: 'analytics' | 'hr' | 'content' | 'ai' | 'social';
  icon: string;          // Lucide icon name (rendered as inline SVG)
  url: string;           // Relative or absolute URL to open the tool
  enabled: boolean;      // Hide disabled tools from non-admin users
  position: number;      // Sort order
};
```

### Navigation flow
```
Overall-Dashboard (home)
  ├─ Card "Commentator" → ../Thmanyah-Commentator-Tool-.../index.html
  ├─ Card "Social Listening" → dev server (5173) / prod URL
  ├─ Card "Chatbot" → dev server / prod URL
  ├─ Card "Podcast & Video" → Next.js dev server / prod URL
  ├─ Card "HR Approval" → Next.js dev server / prod URL
  └─ Card "Feedback Platform" → Next.js dev server / prod URL
```

Each tool keeps functioning independently; the dashboard only provides a
unified launcher.

---

## 4 · Supabase — data model & security

A fresh Supabase project (`overall-dashboard-ahmed`) hosts the tool registry
and access-logging. The schema is intentionally minimal and **RLS is on for
every table**.

### Tables (public schema)

| Table | Purpose |
|---|---|
| `public.profiles` | Extension of `auth.users`: `id uuid PK → auth.users.id`, `full_name`, `role ('admin' \| 'member')`, `created_at`. Auto-inserted by a trigger on sign-up. |
| `public.tools` | Canonical registry of every tool shown on the dashboard. |
| `public.tool_favorites` | `(user_id, tool_id)` pins — personal per user. |
| `public.audit_logs` | Append-only trail of who opened what tool and when (`action`, `metadata jsonb`). |

### Security best practices applied

1. **`alter table … enable row level security`** on all four tables.
2. **Least-privilege policies:**
   - `profiles` — a user can `select`/`update` only their own row.
   - `tools` — any authenticated user can `select` rows where `enabled = true`; only `admin` role can `insert/update/delete`.
   - `tool_favorites` — a user can only see / mutate rows where `user_id = auth.uid()`.
   - `audit_logs` — a user can `insert` only rows with their own `user_id`; `select` is admin-only.
3. **No service-role key in the client.** The dashboard uses only the project's
   **publishable** key (`sb_publishable_…`), which has no elevated privileges.
4. **`security definer` helper `is_admin()`** checks role via `profiles` so
   policies don't recurse — and the function has `search_path = public` pinned.
5. **Triggers** use `set search_path = public, pg_temp` to avoid mutable
   search-path attacks flagged by Supabase advisors.
6. **Auth:** email+password provider only; confirm-email turned on in
   production; admin role assigned manually via SQL (never via client).
7. **CORS / JWT verify** left at Supabase defaults; Edge Functions (if added
   later) require `verify_jwt = true`.
8. **Publishable key** is stored in `Overall-Dashboard/config.js`
   (git-ignored) and a `config.example.js` is committed as template.

### Why not reuse an existing tool's project
Each tool's Supabase project has its own tightly-scoped schema (chat
messages, social-listening candidates, etc.). A separate project for the
dashboard keeps the boundary clean — tools stay independent and the dashboard
layer has no access to tool-internal PII.

---

## 5 · Adding a new tool

1. Drop the new tool's folder into the repo root (sibling of the others).
2. Insert a row into `public.tools` (via Supabase Studio or `execute_sql`):
   ```sql
   insert into public.tools
     (slug, name_ar, name_en, description_ar, category, icon, url, enabled, position)
   values
     ('my-new-tool', 'اسم الأداة', 'My New Tool', 'وصف قصير', 'analytics',
      'bar-chart-3', '../My-New-Tool/index.html', true, 99);
   ```
3. (Optional) Add the same entry to `Overall-Dashboard/tools.js` so the
   dashboard still shows it in offline / static-host mode.
4. Refresh the dashboard — the new card appears automatically.

No dashboard code changes are required for a new tool.

---

## 6 · Roadmap

- [ ] Optional Supabase **Edge Function** `log-tool-open` that both inserts
      into `audit_logs` and issues a signed redirect to the target tool.
- [ ] Per-role visibility (hide HR tools from non-HR users) via an extra
      `allowed_roles text[]` column + matching RLS policy.
- [ ] Global search across all tools' public data (read-only, behind an
      Edge Function).
