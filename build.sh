#!/usr/bin/env bash
# =====================================================================
# Thmanyah Overall Dashboard — unified Vercel build orchestrator
# =====================================================================
#
# ONE deploy = all seven tools live under the same origin. Each tool
# is built INDEPENDENTLY: if one build fails, the rest still ship and
# that tool gets a placeholder page that tells the user how to fix it.
#
# Output layout (served by Vercel from $OUT_DIR):
#   /                          → Overall-Dashboard launcher
#   /commentator/              → Commentator Analysis Tool (vanilla HTML)
#   /chatbot/                  → Chatbot (Vite static export)
#   /social-listening/         → Social Listening (Vite static export)
#   /podcast-video/            → Podcast & Video (Next.js static export)
#   /hr-approval/              → HR Approval (Next.js static export)
#   /feedback-platform/        → Feedback Platform (Next.js static export)
#
# Env toggles (optional):
#   SKIP_INSTALL=1    reuse existing node_modules (fast rebuilds)
#   ONLY_TOOL=<slug>  build only a single tool (debugging)
#   VERBOSE=1         stream per-tool build logs to stdout
#
# Every tool builds in a dedicated subshell so that:
#   · a crashing build never kills the overall deploy
#   · env vars set for one build don't leak into the next
#   · the working directory is restored after each iteration
# =====================================================================

set -u  # NO `set -e`: we WANT to continue past failures. Each tool's
        # exit code is captured individually and reported at the end.

# Move to repo root regardless of where build.sh was invoked from.
REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$REPO_ROOT"

OUT_DIR="${OUT_DIR:-$REPO_ROOT/_site}"
LOG_DIR="$OUT_DIR/_build-logs"

# ── Colours (disabled if not a TTY or CI) ───────────────────────────
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET='\033[0m'; C_DIM='\033[2m'; C_BOLD='\033[1m'
  C_GREEN='\033[32m'; C_YELLOW='\033[33m'; C_RED='\033[31m'; C_BLUE='\033[34m'
else
  C_RESET=''; C_DIM=''; C_BOLD=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_BLUE=''
fi

log()  { printf "${C_DIM}[build.sh]${C_RESET} %s\n" "$*"; }
ok()   { printf "${C_GREEN}${C_BOLD}[ ok  ]${C_RESET} %s\n" "$*"; }
warn() { printf "${C_YELLOW}${C_BOLD}[warn ]${C_RESET} %s\n" "$*"; }
err()  { printf "${C_RED}${C_BOLD}[fail ]${C_RESET} %s\n" "$*"; }
sec()  { printf "\n${C_BLUE}${C_BOLD}━━ %s ━━${C_RESET}\n" "$*"; }

# ── Prepare output directory ────────────────────────────────────────
sec "Preparing output directory"
log "OUT_DIR=$OUT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR" "$LOG_DIR"

# Track which tools succeeded vs. failed so we can print a summary.
declare -a SUCCESS_TOOLS=()
declare -a FAILED_TOOLS=()

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

# Whether `ONLY_TOOL` filter says we should run this slug.
should_build() {
  local slug="$1"
  if [ -n "${ONLY_TOOL:-}" ] && [ "$ONLY_TOOL" != "$slug" ]; then
    return 1
  fi
  return 0
}

# Write a placeholder page for a tool that failed to build. The dashboard
# will still list it and the iframe will show this page instead of a 404.
write_placeholder() {
  local slug="$1" name="$2" reason="$3" dest="$OUT_DIR/$slug"
  mkdir -p "$dest"
  cat > "$dest/index.html" <<EOF
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name} — قيد الصيانة</title>
  <style>
    html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F7F4EE;color:#000;}
    .wrap{height:100%;display:flex;align-items:center;justify-content:center;padding:24px;}
    .card{background:#fff;border:1px solid #EFEDE2;border-radius:16px;padding:40px;max-width:520px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.05);}
    .icon{width:64px;height:64px;border-radius:50%;background:rgba(255,188,10,.15);color:#8B6600;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;}
    h1{margin:0 0 8px;font-size:22px;font-weight:800;}
    p{margin:8px 0 0;color:#494C6B;font-size:14px;line-height:1.7;}
    code{background:#F4F2ED;padding:2px 6px;border-radius:4px;font-size:12px;}
  </style>
</head>
<body>
  <div class="wrap"><div class="card">
    <div class="icon">!</div>
    <h1>${name} — قيد الصيانة</h1>
    <p>تعذّر بناء هذه الأداة في النشر الموحّد.</p>
    <p class="reason"><small>السبب: ${reason}</small></p>
    <p style="margin-top:16px;"><small>راجع سجل البناء في <code>_build-logs/${slug}.log</code> على Vercel.</small></p>
  </div></div>
</body>
</html>
EOF
}

# Build wrapper: runs a command in a subshell, captures the exit code,
# and either copies the output to $OUT_DIR/<slug> or writes a placeholder.
#
# If HIDE_APP_API=1 is set in the caller's env, the tool's
# `src/app/api/` folder is temporarily moved aside during the build.
# Next.js `output: "export"` chokes on API route handlers, so we
# swap them out, run the build, and restore them afterwards. A trap
# guarantees the folder comes back even if the build crashes.
#
# Args: slug human_name tool_dir dist_subdir build_cmd...
build_tool() {
  local slug="$1" name="$2" tool_dir="$3" dist_subdir="$4"
  shift 4
  local log_file="$LOG_DIR/$slug.log"

  if ! should_build "$slug"; then
    log "[$slug] skipped (ONLY_TOOL=$ONLY_TOOL)"
    return 0
  fi

  sec "Building: $name ($slug)"
  log "dir:  $tool_dir"
  log "log:  $log_file"

  if [ ! -d "$tool_dir" ]; then
    err "[$slug] tool directory missing: $tool_dir"
    write_placeholder "$slug" "$name" "directory missing: $tool_dir"
    FAILED_TOOLS+=("$slug")
    return 0
  fi

  # Run build in a subshell so cd/env changes don't escape.
  (
    set +e
    cd "$tool_dir" || exit 97

    # If HIDE_APP_API=1, rename src/app/api aside for the duration of
    # the build and guarantee its restoration via EXIT trap.
    local api_hidden=""
    if [ "${HIDE_APP_API:-0}" = "1" ] && [ -d src/app/api ]; then
      log "[$slug] HIDE_APP_API=1 → moving src/app/api → src/app/_api_hidden_for_export"
      mv src/app/api src/app/_api_hidden_for_export
      api_hidden=1
      trap 'if [ -n "$api_hidden" ] && [ -d src/app/_api_hidden_for_export ]; then mv src/app/_api_hidden_for_export src/app/api; fi' EXIT
    fi

    # Reuse node_modules if SKIP_INSTALL is set, otherwise install fresh.
    if [ -z "${SKIP_INSTALL:-}" ] || [ ! -d node_modules ]; then
      log "[$slug] installing dependencies…"
      if [ -f package-lock.json ]; then
        npm ci --no-audit --no-fund --prefer-offline >> "$log_file" 2>&1
      else
        npm install --no-audit --no-fund --prefer-offline >> "$log_file" 2>&1
      fi
      local install_rc=$?
      if [ $install_rc -ne 0 ]; then
        err "[$slug] npm install failed (rc=$install_rc)"
        exit 98
      fi
    else
      log "[$slug] SKIP_INSTALL=1 → reusing existing node_modules"
    fi

    log "[$slug] running: $*"
    if [ -n "${VERBOSE:-}" ]; then
      "$@" 2>&1 | tee -a "$log_file"
      exit ${PIPESTATUS[0]}
    else
      "$@" >> "$log_file" 2>&1
    fi
  )
  local rc=$?

  # Belt + braces: if the subshell somehow exited without running the
  # trap (e.g. SIGKILL), restore the hidden api folder from the parent.
  if [ -d "$tool_dir/src/app/_api_hidden_for_export" ]; then
    mv "$tool_dir/src/app/_api_hidden_for_export" "$tool_dir/src/app/api" || true
  fi

  if [ $rc -ne 0 ]; then
    err "[$slug] build failed (rc=$rc) — writing placeholder"
    FAILED_TOOLS+=("$slug")
    write_placeholder "$slug" "$name" "build exited with code $rc"
    return 0
  fi

  local src="$tool_dir/$dist_subdir"
  if [ ! -d "$src" ]; then
    err "[$slug] build finished but expected output missing: $src"
    FAILED_TOOLS+=("$slug")
    write_placeholder "$slug" "$name" "missing build artifact: $dist_subdir"
    return 0
  fi

  mkdir -p "$OUT_DIR/$slug"
  # Copy contents (not the dir itself) into $OUT_DIR/$slug/
  cp -a "$src"/. "$OUT_DIR/$slug"/
  ok "[$slug] built → $OUT_DIR/$slug"
  SUCCESS_TOOLS+=("$slug")
}

# Static copy wrapper for vanilla HTML tools.
copy_static_tool() {
  local slug="$1" name="$2" tool_dir="$3"
  if ! should_build "$slug"; then
    log "[$slug] skipped (ONLY_TOOL=$ONLY_TOOL)"
    return 0
  fi
  sec "Copying static: $name ($slug)"
  if [ ! -d "$tool_dir" ]; then
    err "[$slug] directory missing: $tool_dir"
    FAILED_TOOLS+=("$slug")
    write_placeholder "$slug" "$name" "directory missing"
    return 0
  fi
  mkdir -p "$OUT_DIR/$slug"
  cp -a "$tool_dir"/. "$OUT_DIR/$slug"/
  ok "[$slug] copied → $OUT_DIR/$slug"
  SUCCESS_TOOLS+=("$slug")
}

# =====================================================================
# 1. Root launcher — Overall Dashboard (vanilla HTML) + shared fonts
# =====================================================================
sec "Copying root: Overall Dashboard"
cp -a "$REPO_ROOT/Overall-Dashboard"/. "$OUT_DIR"/

# The dashboard references the commentator tool's font/logo assets via
# relative paths (../Thmanyah-Commentator-Tool-.../Usable/...). After
# the monorepo is flattened, those relative paths resolve to
# /Thmanyah-Commentator-Tool-.../Usable/..., so we still need to ship
# the `Usable/` asset folder at that exact path.
mkdir -p "$OUT_DIR/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh"
cp -a \
  "$REPO_ROOT/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/Usable" \
  "$OUT_DIR/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/"

# ── Shared Thmanyah font pool at the site root ──
# Every tool's CSS references fonts via absolute paths like
# `url('/fonts/Thmanyah*.otf')`. Vite rewrites those to include the
# tool's base path during build, but Next.js does NOT — so under
# subpath deploys the Next.js tools' fonts 404 unless we also place
# the font files at the root-level `/fonts/` path. Copying the
# canonical Usable folder here makes the absolute paths resolve
# correctly regardless of which framework built the tool.
mkdir -p "$OUT_DIR/fonts"
cp -a \
  "$REPO_ROOT/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/Usable"/. \
  "$OUT_DIR/fonts"/
# Drop the brand PDF and keep only .otf + .png, since the root /fonts/
# folder should behave like a clean font pool.
find "$OUT_DIR/fonts" -maxdepth 1 -type f ! -name '*.otf' ! -name '*.png' -delete 2>/dev/null || true
# The shared logo also lives at the root so tools can reference it.
cp -f \
  "$REPO_ROOT/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/Usable/thamanyah.png" \
  "$OUT_DIR/thamanyah.png" 2>/dev/null || true
ok "dashboard launcher + shared fonts in place"

# =====================================================================
# 2. Commentator — vanilla HTML copy
# =====================================================================
copy_static_tool \
  "commentator" \
  "Commentator Analysis Tool" \
  "$REPO_ROOT/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh"

# =====================================================================
# 3. Chatbot — Vite static build (BASE_PATH=/chatbot/)
#
# The chatbot talks to Supabase Edge Functions directly from the browser
# (authenticate / chat / process-document). Vite inlines `import.meta.env.VITE_*`
# at BUILD time, so if these vars aren't exported here the compiled bundle
# ends up with string literals like `"undefined/functions/v1/chat"` and
# `Authorization: "Bearer undefined"` — and every call fails.
#
# Defaults match the unified Thmanyah Supabase project declared in
# Overall-Dashboard/config.js. A Vercel project-level env var with the same
# name overrides the default (shell `${VAR:-default}` semantics).
# =====================================================================
: "${VITE_SUPABASE_URL:=https://hbnvbfcwrfanpayxulih.supabase.co}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:=sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv}"
export VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY
log "Using VITE_SUPABASE_URL=$VITE_SUPABASE_URL"

BASE_PATH="/chatbot/" \
VITE_BASE_PATH="/chatbot/" \
  build_tool \
    "chatbot" \
    "Thmanyah AI Assistant" \
    "$REPO_ROOT/New Chatbot - Thmanyah" \
    "dist" \
    npm run build

# =====================================================================
# 4. Social Listening — Vite static build
# The top-level folder is a stub (`index.html` points at a non-existent
# `/src/main.tsx`). The real client lives in `Data-Weaver/client/` with
# its own vite.config.ts (`root: "client"`, `outDir: "dist/public"`).
# We build Data-Weaver directly with `npx vite build` — bypassing its
# `npm run build` which also esbuilds an Express server we don't need
# in a static deploy.
# =====================================================================
BASE_PATH="/social-listening/" \
VITE_BASE_PATH="/social-listening/" \
  build_tool \
    "social-listening" \
    "Social Listening" \
    "$REPO_ROOT/Social-Listening---Final-Bassam-claude-debug-blank-page-3cSDv/Data-Weaver" \
    "dist/public" \
    npx vite build

# =====================================================================
# 5. Podcast & Video — Next.js static export
# =====================================================================
NEXT_EXPORT=1 \
NEXT_BASE_PATH="/podcast-video" \
HIDE_APP_API=1 \
  build_tool \
    "podcast-video" \
    "Podcast & Video Analysis" \
    "$REPO_ROOT/Podcast & Video Analysis Platform" \
    "out" \
    npm run build

# =====================================================================
# 6. HR Approval — Next.js static export
# =====================================================================
NEXT_EXPORT=1 \
NEXT_BASE_PATH="/hr-approval" \
HIDE_APP_API=1 \
  build_tool \
    "hr-approval" \
    "HR Approval Workflow" \
    "$REPO_ROOT/HR-Approval-Workflow-claude-hiring-approval-framework-5782x/HR-Approval-Workflow-claude-hiring-approval-framework-5782x" \
    "out" \
    npm run build

# =====================================================================
# 7. Feedback Platform — Next.js static export
# =====================================================================
NEXT_EXPORT=1 \
NEXT_BASE_PATH="/feedback-platform" \
  build_tool \
    "feedback-platform" \
    "Feedback Analysis Platform" \
    "$REPO_ROOT/Feedback Platform/company-feedback-platform-abdulqudoos-claude-feedback-analysis-platform-dwcOg" \
    "out" \
    npm run build

# =====================================================================
# Final summary
# =====================================================================
sec "Build summary"
if [ ${#SUCCESS_TOOLS[@]} -gt 0 ]; then
  ok "Built: ${SUCCESS_TOOLS[*]}"
fi
if [ ${#FAILED_TOOLS[@]} -gt 0 ]; then
  warn "Failed: ${FAILED_TOOLS[*]}"
  warn "Each failed tool has a placeholder at /<slug>/index.html"
  warn "Logs: $LOG_DIR"
fi

log "Output directory: $OUT_DIR"
log "Files written:"
if command -v find >/dev/null 2>&1; then
  find "$OUT_DIR" -maxdepth 2 -type d | sort | sed 's/^/    /'
fi

# IMPORTANT: exit 0 even on partial failures. A single broken tool must
# not kill the entire deploy — the whole point of fault isolation.
exit 0
