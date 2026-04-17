# Deployment Guide — Thmanyah Overall Dashboard

> **One Vercel project. One `vercel deploy`. All seven tools live.**
>
> This repo ships the Overall Dashboard launcher and six tools as a
> single Vercel deployment. Every tool stays in its own folder — kept
> as an independent module so each can be edited, tested, and even
> broken without taking down the rest. The root-level `build.sh`
> orchestrates every tool's build in a fault-isolated subshell and
> collates the results into a unified `_site/` directory that Vercel
> serves as static output.

---

## 1. Architecture at a glance

```
┌───────────────────────────────────────────────────────────────┐
│  ONE Vercel project  —  "thmanyah-overall-dashboard"          │
│  Root Directory: /  (this repo)                               │
│  Build Command:  bash build.sh                                │
│  Output Directory: _site/                                     │
│                                                               │
│  Served paths (all same-origin):                              │
│    /                       → Overall-Dashboard launcher       │
│    /commentator/           → Commentator Analysis (vanilla)   │
│    /chatbot/               → Chatbot (Vite static)            │
│    /social-listening/      → Social Listening (Vite static)   │
│    /podcast-video/         → Podcast & Video (Next.js export) │
│    /hr-approval/           → HR Approval (Next.js export)     │
│    /feedback-platform/     → Feedback Analysis (Next.js)      │
└───────────────────────────────────────────────────────────────┘
                               │
                               │ (all seven tools share a single
                               │  Supabase project via the shared
                               │  publishable key)
                               ▼
┌───────────────────────────────┐
│   Supabase (shared)           │
│   project: hbnvbfcwrfanpayxulih│
│   schemas:                    │
│     public (dashboard)        │
│     chatbot                   │
│     social_listening          │
└───────────────────────────────┘
```

### Why single deploy?

- **Cross-origin iframe issues vanish.** Every tool lives under the
  same origin as the dashboard, so there's no `X-Frame-Options`
  or CSP `frame-ancestors` dance — iframes just work.
- **One `git push` = everything live.** No six-project Vercel
  dashboard to babysit. No six URLs to paste into `TOOL_URLS`.
- **Independent modules, one commit history.** Each tool keeps its
  own folder, its own `package.json`, its own build config. They're
  still self-contained — you can `cd` into any of them and run
  `npm run dev` locally just like before.
- **Fault isolation at build time.** If one tool's `npm run build`
  blows up, `build.sh` logs the failure, writes a placeholder page at
  `/<slug>/index.html`, and keeps going. The other tools still ship.

---

## 2. The build orchestrator (`build.sh`)

`build.sh` is the heart of the single-deploy strategy. Vercel runs
it via the `buildCommand` defined in the root `vercel.json`. At a
glance:

```bash
# Invoked by Vercel:
bash build.sh

# Useful local flags:
SKIP_INSTALL=1 bash build.sh            # reuse node_modules (fast rebuilds)
ONLY_TOOL=chatbot bash build.sh         # build a single tool, skip the rest
VERBOSE=1 bash build.sh                 # stream per-tool logs to stdout
```

What it does, in order:

1. **Wipe `_site/`** and create a fresh output directory.
2. **Copy the Overall Dashboard** (`Overall-Dashboard/`) to `_site/`
   — this is the root launcher. The Commentator tool's shared
   font/logo assets get mirrored under
   `_site/Thmanyah-Commentator-Tool-…/Usable/` so the dashboard's
   relative `../…/Usable/…` paths continue to resolve.
3. **For every other tool**, run `build_tool slug name tool_dir dist_subdir npm run build`
   inside an isolated subshell that:
   - installs dependencies (`npm ci` if `package-lock.json` is
     present, otherwise `npm install`);
   - exports the tool-specific build env vars (`BASE_PATH=/slug/`
     for Vite, `NEXT_EXPORT=1` + `NEXT_BASE_PATH=/slug` for Next.js);
   - runs the tool's build;
   - copies the produced `dist/` or `out/` folder into `_site/<slug>/`.
4. **On any failure**, write a placeholder `_site/<slug>/index.html`
   that says the tool is offline and points at `/_build-logs/<slug>.log`
   so you can read the Vercel build log after deploy.
5. **Exit 0** — even if some tools failed. A single broken tool must
   never block the rest of the dashboard from shipping.

### Per-tool build configuration

Each tool reads environment variables in its own build config so the
same source tree works in two modes:

| Tool | Config file | Envs consumed | Output |
|---|---|---|---|
| Chatbot | `vite.config.ts` | `BASE_PATH` | `dist/` |
| Social Listening | `vite.config.ts` | `BASE_PATH` | `dist/` |
| Podcast & Video | `next.config.js` | `NEXT_EXPORT`, `NEXT_BASE_PATH` | `out/` |
| HR Approval | `next.config.ts` | `NEXT_EXPORT`, `NEXT_BASE_PATH` | `out/` |
| Feedback Platform | `next.config.mjs` | `NEXT_EXPORT`, `NEXT_BASE_PATH` | `out/` |

Local dev (`npm run dev`) never sets those env vars, so every tool
still runs on its dev port with full framework features — including
server actions and API routes in the Next.js tools.

### Known limitation: Next.js server features in static mode

Next.js static export (`output: 'export'`) disables **server
actions**, **API routes**, and **dynamic server components**. Tools
that currently depend on server features fall into two buckets:

- **Feedback Platform** — pure client-side, exports cleanly
  (`hideApi: true` in `tool.json`; no API routes shipped).
- **HR Approval** — analysis moved from `/api/analyze` to the
  `hr-approval-analyze` edge function. The route has been deleted,
  and the submit page now calls `supabase.functions.invoke(...)`.
- **Podcast & Video** — still has `/api/*` routes for heavier tasks
  (transcription). In the unified deploy those routes 404. Migration
  path: move the server logic into Supabase Edge Functions (the
  shared project already hosts the chatbot's functions) or replace
  `fetch('/api/...')` calls with direct `@supabase/supabase-js` calls
  backed by RLS-protected tables.
- **Commentator** — vanilla HTML, no bundler. Now talks to Supabase
  via `/shared/supabase-client.js` (copied to the site root from
  `Overall-Dashboard/shared/`) and routes OpenRouter through the
  `commentator-analyze` edge function. No keys in the bundle.
- **Social Listening** — analysis calls now go through the
  `social-listening-analyze` edge function. The previous hardcoded
  `sk-or-v1-…` key has been removed from `src/lib/ai-analysis.ts`.

If a Next.js tool's build fails in the unified deploy because of
a server-only feature, `build.sh` will fall through gracefully and
ship a placeholder — the rest of the dashboard is unaffected.

---

## 3. First-time Vercel setup

1. **Vercel → Add New → Project → Import this repo.**
2. **Root Directory:** leave as `/` (the repo root).
3. **Framework Preset:** `Other` — Vercel will auto-detect the
   `buildCommand` / `outputDirectory` from `vercel.json`. Do NOT
   override them.
4. **Environment variables:** none are required for the build step
   itself. The unified Supabase URL + publishable key are baked into
   `Overall-Dashboard/config.js`. If any individual tool pulls secrets
   from env at build time (check its `.env.example`), set them in the
   Vercel project settings under the standard `Production` /
   `Preview` scopes.
5. **Deploy.**

That's it. Any subsequent `git push` to the production branch
triggers a rebuild that runs `bash build.sh` and redeploys every tool
from scratch in one pass.

---

## 4. Supabase

The shared project is `hbnvbfcwrfanpayxulih` (region `us-east-1`).
Migrations live in `Overall-Dashboard/supabase/migrations/` and must
be applied in filename order:

| # | File | Purpose |
|---|---|---|
| 1 | `20260411140100_init_profiles_and_role.sql` | `profiles`, `app_role`, `is_admin()`, new-user trigger |
| 2 | `20260411140200_init_tools_registry.sql` | `tools` table + six seed rows |
| 3 | `20260411140300_init_favorites_and_audit.sql` | `tool_favorites`, `audit_logs` |
| 4 | `20260411140400_rls_policies_and_optimization.sql` | Optimized RLS + FK indexes |
| 5 | `20260411150100_reflect_chatbot_schema.sql` | Isolated `chatbot` schema (pgvector, pg_trgm) |
| 6 | `20260411150200_reflect_social_listening_schema.sql` | Isolated `social_listening` schema |
| 7 | `20260411160100_chatbot_fk_indexes.sql` | FK covering indexes for advisor lints |
| 8 | `20260417120100_tools_revision_commentator_and_security.sql` | `commentator` schema + reports table + RLS, performance indexes, deprecates plaintext `chatbot.app_users` passwords |

```bash
cd Overall-Dashboard/supabase
for f in migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

The `documents` storage bucket (private, `authenticated` role) still
needs to be created manually in the Supabase dashboard.

### Edge-function secrets

In **Supabase Dashboard → Project → Edge Functions → Secrets** set:

- `OPENAI_API_KEY` — used by the chatbot's RAG pipeline
- `OPENROUTER_API_KEY` — used by `commentator-analyze`, `social-listening-analyze`, and `hr-approval-analyze`
- `SUPABASE_SERVICE_ROLE_KEY` — auto-populated

Then deploy every edge function:

```bash
cd Overall-Dashboard
supabase functions deploy commentator-analyze        --project-ref hbnvbfcwrfanpayxulih
supabase functions deploy social-listening-analyze   --project-ref hbnvbfcwrfanpayxulih
supabase functions deploy hr-approval-analyze        --project-ref hbnvbfcwrfanpayxulih

# chatbot functions still ship from their own folder
cd "../New Chatbot - Thmanyah"
supabase functions deploy chat             --project-ref hbnvbfcwrfanpayxulih
supabase functions deploy process-document --project-ref hbnvbfcwrfanpayxulih
supabase functions deploy authenticate     --project-ref hbnvbfcwrfanpayxulih
```

---

## 5. OpenRouter key handling (security)

The OpenRouter key is **no longer** in the browser bundle. Commentator,
Social Listening, and HR Approval all call a Supabase Edge Function
(`commentator-analyze` / `social-listening-analyze` /
`hr-approval-analyze`) that holds the key server-side and requires a
signed-in Supabase user. To rotate:

1. Generate a new key in the OpenRouter dashboard.
2. Update `OPENROUTER_API_KEY` in Supabase → Edge Functions → Secrets.
3. Revoke the old key.

No client redeploy is needed — the functions pick up the new secret
on the next invocation.

---

## 6. Local development

### Just the dashboard (no tools)

```bash
cd Overall-Dashboard
python3 -m http.server 8765
# visit http://localhost:8765
```

The tool cards will use the URLs in `config.js → TOOL_URLS`, which
point at same-origin paths like `/chatbot/`. If those paths don't
exist yet they'll 404 inside the iframe — that's expected in raw dev
mode.

### Full local preview (mirrors production)

```bash
bash build.sh                                 # build all tools once
cd _site && python3 -m http.server 8765       # serve the unified output
# visit http://localhost:8765
```

Every tool is now reachable at its production path (`/chatbot/`,
`/feedback-platform/`, etc.) just like it will be on Vercel.

Fast iteration on a single tool:

```bash
SKIP_INSTALL=1 ONLY_TOOL=chatbot bash build.sh
```

### Individual tool dev

Each tool still runs standalone, untouched:

```bash
cd "New Chatbot - Thmanyah"
cp .env.example .env.local
npm install
npm run dev
```

Local dev never sets `BASE_PATH` or `NEXT_EXPORT`, so each tool
behaves exactly as it did before the unification work.

---

## 7. Troubleshooting

### "A tool's iframe shows a placeholder"

That means its `npm run build` failed during the unified deploy.
Steps:
1. Open `https://YOUR-DEPLOY/_build-logs/<slug>.log` to read the
   actual build error (no auth wall — the logs are shipped as part
   of `_site/`).
2. Reproduce locally with `ONLY_TOOL=<slug> bash build.sh`.
3. Fix and push.

### "Assets 404 under /<slug>/"

The tool's build config isn't honouring the `BASE_PATH` /
`NEXT_BASE_PATH` env var. Check that the tool's `vite.config.ts` or
`next.config.*` reads the env and sets `base` / `basePath`
accordingly. All five framework tools in this repo already do.

### "I want a tool to run on a separate Vercel project instead"

Open `Overall-Dashboard/config.js` and replace the same-origin path
in `TOOL_URLS` with the absolute URL of the dedicated deploy:

```js
TOOL_URLS: {
  'podcast-video': 'https://thmanyah-podcast-video.vercel.app',
  // …
}
```

The dashboard will iframe the external URL instead. That tool will
also need a `Content-Security-Policy: frame-ancestors` header
pointing back at your dashboard origin to allow the embed.
