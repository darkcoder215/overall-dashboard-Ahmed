# Overall Dashboard — ثمانية

One unified launcher for every tool in this mono‑repo. Matches the visual
language of the **Commentator Analysis** tool (sidebar + top bar + welcome
hero + stats + content grid) and drives the tool list from a Supabase
table so new tools can be added without touching the dashboard code.

```
Overall-Dashboard/
├─ index.html   # App shell (sidebar, views, auth modal)
├─ styles.css   # Design tokens lifted from the Commentator tool
├─ app.js       # Navigation, theme, Supabase client, tool registry loader
├─ tools.js     # Static fallback registry (mirrors the `tools` table)
├─ config.js    # SUPABASE_URL + publishable key
└─ README.md
```

## Run locally

The dashboard is a zero-build static site. Any HTTP server works:

```bash
# From the repo root
python3 -m http.server 8000
# then open http://localhost:8000/Overall-Dashboard/index.html
```

Opening `index.html` via `file://` works for everything except the
Supabase client (which requires a real HTTP origin). In `file://` mode
the dashboard automatically falls back to the **static registry** in
`tools.js` and still renders all six tool cards.

## How tools are discovered

1. On load, the page immediately renders cards from `tools.js` (so you
   never see a blank screen).
2. Then it calls `supabase.from('tools').select(...)` to refresh the list
   from the `public.tools` table.
3. If the call succeeds, the DB rows replace the static ones. Each row
   has a stable `id`, which the favorites + audit features rely on.

## Adding a new tool

1. Insert a row in Supabase Studio (or via `execute_sql`):
   ```sql
   insert into public.tools (slug, name_ar, name_en, description_ar,
                             category, icon, url, position)
   values ('my-tool', 'اسم الأداة', 'My Tool', 'وصف قصير',
           'analytics', 'bar-chart-3', '../My-Tool/index.html', 99);
   ```
2. Add the same entry to `tools.js` so offline/static mode sees it too.
3. If the icon name isn't in `ICONS`, add its SVG `<path>` markup to the
   `ICONS` map in `tools.js`.

No dashboard code changes are required.

## Auth

Auth is optional. When `REQUIRE_AUTH` is `false` (default), anyone can
load the page and launch tools. Signing in unlocks:

- **Favorites** (`public.tool_favorites`, per user)
- **Activity log** (`public.audit_logs` — user sees only their own rows,
  admins see everything)
- The "Tools you can see" list is filtered by RLS (a disabled tool is
  only visible to admins).

Auth uses Supabase's email+password provider. Sign-up / password reset
happens in the Supabase dashboard or a dedicated Edge Function — the
Overall Dashboard exposes **sign-in only** to avoid confusing end users.

## Security notes

- The browser ships the **publishable key** (`sb_publishable_…`), never
  the service-role key. Every table has **RLS enabled** and explicit
  policies — the key alone grants no elevated access.
- The `is_admin()` helper is `security definer` with a pinned
  `search_path` so it can be used inside policies without recursing.
- `audit_logs` rows can only be **inserted**. There is no update/delete
  policy, so the trail is append-only from the client.
- CORS, JWT verification, etc. use Supabase defaults.

See `../TOOLS_MAP.md` for the repo-wide architecture.
