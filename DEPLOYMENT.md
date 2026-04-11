# Deployment Guide — Thmanyah Overall Dashboard

> This monorepo ships **seven independently-deployable apps** that are
> stitched together at runtime by the `Overall-Dashboard/` app. Each
> tool card in the dashboard opens its destination URL in an in-place
> `<iframe>` tab, so the user stays on the dashboard while working
> inside any tool.
>
> All seven apps share a single Supabase project
> (`hbnvbfcwrfanpayxulih`, region: `us-east-1`). Tool-specific schemas
> live in isolated Postgres schemas — see
> `Overall-Dashboard/supabase/migrations/` for the canonical SQL.

---

## 1. Architecture at a glance

```
┌──────────────────────────────────────────────────────────┐
│  Vercel project #1  — "thmanyah-overall-dashboard"        │
│  Root: /  (this repo)                                     │
│                                                           │
│  Serves (via /vercel.json rewrites):                      │
│    /                → /Overall-Dashboard/index.html       │
│    /commentator     → /Thmanyah-Commentator-Tool-.../     │
│    /dashboard/…     → /Overall-Dashboard/…                │
│                                                           │
│  Content: two vanilla HTML apps                           │
│    · Overall-Dashboard/  (the launcher itself)            │
│    · Thmanyah-Commentator-Tool-.../  (sports analysis)    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│  Vercel #2 — chatbot     │  │  Vercel #3 — social      │
│  Root: /New Chatbot.../  │  │  Root: /Social-List.../  │
│  Framework: Vite         │  │  Framework: Vite         │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│  Vercel #4 — podcast     │  │  Vercel #5 — hr-approval │
│  Root: /Podcast.../      │  │  Root: /HR-Approval.../  │
│  Framework: Next.js      │  │  Framework: Next.js      │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐
│  Vercel #6 — feedback    │
│  Root: /Feedback.../     │
│  Framework: Next.js      │
└──────────────────────────┘
             ▲
             │   (all 6 subprojects share the same Supabase project)
┌────────────┴─────────────┐
│   Supabase (shared)      │
│   project:               │
│   hbnvbfcwrfanpayxulih   │
│                          │
│   schemas:               │
│     public (dashboard)   │
│     chatbot              │
│     social_listening     │
└──────────────────────────┘
```

Why one Vercel project per framework app? Because mixing Next.js,
Vite, and raw HTML under a single deployment forces awkward
`buildCommand` contortions and breaks framework detection. Vercel's
"one repo, many projects" pattern (each with its own **Root
Directory**) is simpler and scales.

The dashboard discovers every tool's live URL at runtime through
`Overall-Dashboard/config.js → DASHBOARD_CONFIG.TOOL_URLS`. You only
edit that file once per deploy.

---

## 2. One-time setup

### 2.1 Supabase

The schema is already applied to project `hbnvbfcwrfanpayxulih`.
If you need to reproduce it on a fresh project:

```bash
cd Overall-Dashboard/supabase
# Order matters — filenames are timestamped.
for f in migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

Migrations (executed in order):

| # | File | Purpose |
|---|---|---|
| 1 | `20260411140100_init_profiles_and_role.sql` | `profiles`, `app_role`, `is_admin()`, new-user trigger |
| 2 | `20260411140200_init_tools_registry.sql` | `tools` table + six seed rows |
| 3 | `20260411140300_init_favorites_and_audit.sql` | `tool_favorites`, `audit_logs` |
| 4 | `20260411140400_rls_policies_and_optimization.sql` | Optimized RLS + FK indexes |
| 5 | `20260411150100_reflect_chatbot_schema.sql` | Isolated `chatbot` schema (8 tables, pgvector, pg_trgm) |
| 6 | `20260411150200_reflect_social_listening_schema.sql` | Isolated `social_listening` schema (5 tables) |

Storage bucket `documents` must be created manually in the Supabase
dashboard (private, `authenticated` role only).

### 2.2 Edge-function secrets

Inside **Supabase Dashboard → Project → Edge Functions → Secrets**
set, at minimum:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (auto-populated by Supabase itself)

Then deploy the edge functions from each source tool via the Supabase
CLI, e.g.

```bash
cd "New Chatbot - Thmanyah"
supabase functions deploy chat            --project-ref hbnvbfcwrfanpayxulih
supabase functions deploy process-document --project-ref hbnvbfcwrfanpayxulih
supabase functions deploy authenticate    --project-ref hbnvbfcwrfanpayxulih
```

---

## 3. Vercel — create six projects

For each of the six app directories below, do this once:

1. In Vercel, **Add New → Project → Import Git Repository** (pick this repo).
2. Set **Root Directory** to the subfolder.
3. Framework Preset is auto-detected (verify against table).
4. Add the environment variables from each folder's `.env.example`.
5. Deploy.

| App | Root directory | Framework | Env vars file |
|---|---|---|---|
| **Overall Dashboard + Commentator** | `.` (repo root) | Other (static) | — |
| **Chatbot** | `New Chatbot - Thmanyah` | Vite | `.env.example` |
| **Social Listening** | `Social-Listening---Final-Bassam-claude-debug-blank-page-3cSDv` | Vite | `.env.example` |
| **Podcast & Video** | `Podcast & Video Analysis Platform` | Next.js | `.env.example` |
| **HR Approval** | `HR-Approval-Workflow-claude-hiring-approval-framework-5782x/HR-Approval-Workflow-claude-hiring-approval-framework-5782x` | Next.js | `.env.example` |
| **Feedback Platform** | `Feedback Platform/company-feedback-platform-abdulqudoos-claude-feedback-analysis-platform-dwcOg` | Next.js | `.env.example` |

> The root-level project (`.`) exists to serve the two vanilla HTML
> apps (Overall-Dashboard and the Commentator tool) together, so that
> the dashboard's relative `../Thmanyah-Commentator-Tool-.../Usable/`
> font/logo references resolve correctly.

---

## 4. Wire the tool URLs into the dashboard

After every tool has a live Vercel URL, open
`Overall-Dashboard/config.js` and fill in the `TOOL_URLS` map:

```js
TOOL_URLS: {
  'commentator':       '/commentator',                                    // same origin
  'chatbot':           'https://thmanyah-chatbot.vercel.app',
  'social-listening':  'https://thmanyah-social-listening.vercel.app',
  'podcast-video':     'https://thmanyah-podcast-video.vercel.app',
  'hr-approval':       'https://thmanyah-hr-approval.vercel.app',
  'feedback-platform': 'https://thmanyah-feedback.vercel.app',
},
```

Redeploy the root project. The dashboard will now open every tool
inside an iframe tab.

---

## 5. iframe embedding — CSP notes

By default, Next.js and Vite both emit
`X-Frame-Options: SAMEORIGIN`, which blocks cross-origin iframing.
The dashboard and each tool live on **different** Vercel subdomains,
so you have two options:

### Option A — allow the dashboard origin (recommended)

Add a `Content-Security-Policy: frame-ancestors` header to each
tool's `vercel.json`. Example for the chatbot:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://*.vercel.app https://YOUR-DASHBOARD-DOMAIN"
        }
      ]
    }
  ]
}
```

Replace `YOUR-DASHBOARD-DOMAIN` with whatever the root project's
primary domain ends up being.

### Option B — same-origin rewrites

Host everything under the **root** Vercel project by adding rewrites
to the root `vercel.json` that proxy each tool's path to its Vercel
deployment URL. This keeps the iframe same-origin from the browser's
point of view and avoids CSP entirely, at the cost of an extra
network hop per request.

```json
{
  "rewrites": [
    { "source": "/chatbot/(.*)", "destination": "https://thmanyah-chatbot.vercel.app/$1" }
  ]
}
```

Pick whichever fits your hosting posture.

---

## 6. Rotating the OpenRouter key (security)

`Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/app.js`
currently ships a hardcoded `sk-or-v1-...` OpenRouter API key (see
line 7). **Rotate this key immediately** before any public deploy and
replace the direct call with a Supabase edge function that proxies
the request server-side. The `.env.example` in that folder sketches
the layout for the proxy URL.

---

## 7. Local development

```bash
# 1. Dashboard + commentator (vanilla HTML — no build step)
cd Overall-Dashboard
python3 -m http.server 8765
# visit http://localhost:8765

# 2. Any framework tool
cd "New Chatbot - Thmanyah"
cp .env.example .env.local
npm install
npm run dev
```

If you want the dashboard to point at your local dev servers,
temporarily edit `Overall-Dashboard/config.js → TOOL_URLS` to use
`http://localhost:5173` (Vite) or `http://localhost:3000` (Next.js).
Remember to revert before committing.
