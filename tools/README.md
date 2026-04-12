# Tools

Every tool in the Thmanyah Overall Dashboard lives in its own folder under
`tools/`, fully self-contained. The root-level `build.sh` discovers tools
automatically from their `tool.json` manifest, so adding, updating, or
removing a tool is a **local** change that never touches the build script
or any other tool.

```
tools/
├── README.md                ← this file
├── commentator/             ← static HTML tool
│   ├── tool.json            ← manifest
│   └── Usable/              ← tool source
├── chatbot/                 ← Vite tool
│   ├── tool.json
│   ├── package.json
│   └── src/
├── social-listening/        ← Vite tool with nested source dir
│   ├── tool.json
│   └── Data-Weaver/
│       ├── package.json
│       └── …
├── hr-approval/             ← Next.js tool
│   ├── tool.json
│   ├── package.json
│   └── src/
├── podcast-video/
│   └── …
└── feedback-platform/
    └── …
```

---

## Adding a new tool

1. **Create a folder** under `tools/` using a URL-safe slug
   (lowercase, dashes, no spaces):

   ```
   mkdir -p tools/my-new-tool
   ```

2. **Drop the tool's source inside.** Keep whatever layout the tool came
   with — `package.json` at the root, nested `Foo-Bar/` dir, plain HTML,
   doesn't matter. You describe the layout to the build script via the
   manifest (next step).

3. **Add `tools/my-new-tool/tool.json`** using the schema below. A minimal
   Next.js example:

   ```json
   {
     "slug": "my-new-tool",
     "name": "My New Tool",
     "nameAr": "أداتي الجديدة",
     "type": "next",
     "sourceDir": ".",
     "dist": "out",
     "buildCmd": "npm run build",
     "basePath": "/my-new-tool",
     "hideApi": true
   }
   ```

4. **Commit and push.** `build.sh` picks it up on the next deploy — no
   changes to the build script, no changes to other tools. The tool is
   served at `https://<your-domain>/my-new-tool/`.

5. *(Optional)* **Add a launcher tile** in `Overall-Dashboard/index.html`
   so users can discover the tool from the dashboard. Purely cosmetic —
   the tool works either way.

That's it. If the build fails, a placeholder page is written at
`/my-new-tool/index.html` and the full log ends up at
`_build-logs/my-new-tool.log` on Vercel so you can debug without the
rest of the deploy collapsing.

---

## `tool.json` schema

| Field        | Required | Type    | Description                                                                                                                                                               |
|--------------|----------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `slug`       | ✓        | string  | URL segment **and** folder name. Must match the directory it lives in. Used everywhere: `/slug/`, `_build-logs/slug.log`, log messages.                                   |
| `name`       | ✓        | string  | Human-readable English name. Shown in the dashboard launcher and build logs.                                                                                              |
| `nameAr`     |          | string  | Arabic name. Shown in the launcher card for Arabic users.                                                                                                                 |
| `type`       | ✓        | enum    | One of `static`, `vite`, `next`. Drives the build pipeline.                                                                                                               |
| `sourceDir`  |          | string  | Path **relative to the tool folder** where the build is run. Defaults to `.`. Use this when the tool is wrapped in a nested directory like `Data-Weaver/`.                |
| `buildCmd`   | ✓ ⁺      | string  | Shell command to build the tool. Runs inside `sourceDir`. Typical values: `npm run build`, `npx vite build`. Not required for `static` tools.                             |
| `dist`       | ✓ ⁺      | string  | Path **relative to `sourceDir`** where the build artifact ends up. Examples: `out` (Next.js), `dist` (Vite), `dist/public`. Not required for `static` tools.              |
| `basePath`   | ✓        | string  | URL prefix the tool is served from. **Vite** expects a trailing slash (`/slug/`), **Next.js** expects none (`/slug`). See per-framework notes below.                      |
| `hideApi`    |          | boolean | Next.js only. When `true`, `src/app/api` is temporarily moved aside during the build so `output: "export"` doesn't choke on API route handlers. Restored automatically.   |

⁺ Required for `vite` and `next`; ignored for `static`.

---

## Tool types

### `static`

A plain folder of HTML/CSS/JS. `build.sh` just copies
`sourceDir/**` into `_site/<slug>/`. Use this for quick landing pages,
documentation, or tools that don't need a bundler.

```json
{
  "slug": "commentator",
  "name": "Commentator Analysis Tool",
  "type": "static",
  "sourceDir": ".",
  "basePath": "/commentator"
}
```

### `vite`

Built with Vite. `build.sh` exports two env vars before running `buildCmd`:

- `BASE_PATH` — e.g. `/chatbot/`
- `VITE_BASE_PATH` — same value

Your `vite.config.ts` should honour one of them:

```ts
export default defineConfig({
  base: process.env.VITE_BASE_PATH || process.env.BASE_PATH || '/',
  // …
});
```

After the build, `dist/` (or whatever you set in `dist`) is copied to
`_site/<slug>/`.

### `next`

Built with Next.js static export (`output: "export"`). `build.sh` exports:

- `NEXT_BASE_PATH` — e.g. `/hr-approval` (no trailing slash)
- `NEXT_EXPORT=1`

Your `next.config.ts` should honour it:

```ts
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_BASE_PATH || '',
  images: { unoptimized: true },
  // …
};
```

After the build, the `out/` directory is copied to `_site/<slug>/`.

**⚠️ API routes** — Next.js `output: "export"` refuses to build if
`src/app/api/` exists, even if the routes aren't referenced. Set
`"hideApi": true` in the manifest and `build.sh` will move the `api`
folder aside for the build and restore it afterwards. Your tool must
gracefully degrade client-side when those endpoints are unreachable
(typically: call Supabase directly from the browser instead).

---

## Shared environment

Every tool build inherits the following env vars. No per-tool setup
required.

| Variable                          | Source                                                | Used by            |
|-----------------------------------|-------------------------------------------------------|--------------------|
| `VITE_SUPABASE_URL`               | Vercel env var, fallback in `build.sh`                | Vite tools         |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Vercel env var, fallback in `build.sh`                | Vite tools         |
| `NEXT_PUBLIC_SUPABASE_URL`        | Vercel env var, fallback in `build.sh`                | Next.js tools      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Vercel env var, fallback in `build.sh`                | Next.js tools      |

To override any of them for a specific deploy, set the var at the Vercel
project level and `build.sh` will pick it up automatically (the `:=`
pattern only assigns when unset).

### Shared `/fonts/` pool

Next.js does **not** rewrite absolute URLs like `url('/fonts/Foo.otf')`
to include the tool's `basePath`. To keep those references working under
subpath deploys, `build.sh` copies the Thmanyah font pool to `_site/fonts/`
at the site root. Any tool — Next.js or Vite — can reference
`/fonts/Thmanyahserifdisplay12-Bold.otf` and it resolves.

---

## Build-time env toggles

Set these when running `./build.sh` locally to iterate faster.

| Variable             | Effect                                                                                          |
|----------------------|-------------------------------------------------------------------------------------------------|
| `SKIP_INSTALL=1`     | Reuse existing `node_modules` per tool. ~10× faster rebuilds. Safe if deps haven't changed.     |
| `ONLY_TOOL=<slug>`   | Build a single tool. The launcher and other tools are still emitted as empty shells.            |
| `VERBOSE=1`          | Stream per-tool build logs to stdout instead of only `_build-logs/<slug>.log`.                  |

Examples:

```bash
# full clean deploy
./build.sh

# just rebuild chatbot after a code change
SKIP_INSTALL=1 ONLY_TOOL=chatbot ./build.sh

# see why hr-approval is failing
VERBOSE=1 ONLY_TOOL=hr-approval ./build.sh
```

---

## Fault isolation

Each tool builds in an isolated subshell. Specifically:

- A crashing build **never** kills the overall deploy — the failed tool
  gets a placeholder page at `/<slug>/index.html` and the dashboard
  keeps shipping.
- Env vars set for one build **do not** leak into the next build.
- The working directory is restored between tools.
- Every tool's full build log is written to `_build-logs/<slug>.log`
  in the deployed output, so you can inspect failures on Vercel
  without a second deploy.

This is intentional: the whole point of a dashboard of tools is that
one broken tool shouldn't block the others.
