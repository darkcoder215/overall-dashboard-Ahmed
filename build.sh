#!/usr/bin/env bash
# =====================================================================
# Thmanyah Overall Dashboard — unified Vercel build orchestrator
# =====================================================================
#
# ONE deploy = the root launcher + every tool under `tools/`, all live
# under the same origin. The build is DATA-DRIVEN: this script just
# iterates `tools/*/tool.json` and builds each tool according to its
# manifest. Adding a new tool is therefore a two-step change with
# no edits to this file (see `tools/README.md`).
#
# Output layout (served by Vercel from $OUT_DIR):
#   /                          → Overall-Dashboard launcher
#   /<slug>/                   → one folder per tool (slug from tool.json)
#   /fonts/                    → shared Thmanyah font pool (from commentator)
#
# Each tool is built in an isolated subshell so that:
#   · a crashing build never kills the overall deploy
#   · env vars set for one build don't leak into the next
#   · the working directory is restored after each iteration
#
# Env toggles (optional):
#   SKIP_INSTALL=1    reuse existing node_modules (fast rebuilds)
#   ONLY_TOOL=<slug>  build only a single tool (debugging)
#   VERBOSE=1         stream per-tool build logs to stdout
# =====================================================================

set -u  # NO `set -e`: we WANT to continue past failures. Each tool's
        # exit code is captured individually and reported at the end.

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$REPO_ROOT"

OUT_DIR="${OUT_DIR:-$REPO_ROOT/_site}"
LOG_DIR="$OUT_DIR/_build-logs"
TOOLS_DIR="$REPO_ROOT/tools"
DASHBOARD_DIR="$REPO_ROOT/Overall-Dashboard"

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

declare -a SUCCESS_TOOLS=()
declare -a FAILED_TOOLS=()

# ---------------------------------------------------------------------
# Manifest reader
#
# `tool.json` is plain JSON. We don't want a hard dependency on `jq`
# or `python`, so we read it with a tiny Node one-liner (Node is
# already required because every non-static tool builds with npm).
# The reader exports each field as `M_<UPPER>` into the current shell.
# ---------------------------------------------------------------------
read_manifest() {
  local file="$1"
  if [ ! -f "$file" ]; then
    return 1
  fi
  local exports
  exports=$(node -e '
    const m = require(process.argv[1]);
    const kv = (k, v) => {
      if (v === undefined || v === null) return;
      // Escape single quotes for POSIX shell by wrapping in '\'...'\''.
      const s = String(v).replace(/'"'"'/g, `'"'"'\\'"'"''"'"'`);
      process.stdout.write(`M_${k}='"'"'${s}'"'"'\n`);
    };
    kv("SLUG", m.slug);
    kv("NAME", m.name);
    kv("NAME_AR", m.nameAr);
    kv("TYPE", m.type);
    kv("SOURCE_DIR", m.sourceDir || ".");
    kv("DIST", m.dist || "");
    kv("BUILD_CMD", m.buildCmd || "");
    kv("BASE_PATH", m.basePath || "");
    kv("HIDE_API", m.hideApi ? "1" : "0");
  ' "$file" 2>/dev/null)
  if [ -z "$exports" ]; then
    return 1
  fi
  eval "$exports"
  return 0
}

should_build() {
  local slug="$1"
  if [ -n "${ONLY_TOOL:-}" ] && [ "$ONLY_TOOL" != "$slug" ]; then
    return 1
  fi
  return 0
}

# Write a placeholder page for a tool that failed to build. The dashboard
# still lists it and the iframe shows this page instead of a 404.
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

# Copy the build output (or the static source) into $OUT_DIR/<slug>/.
copy_to_out() {
  local slug="$1" src="$2"
  mkdir -p "$OUT_DIR/$slug"
  cp -a "$src"/. "$OUT_DIR/$slug"/
}

# ---------------------------------------------------------------------
# Build a single tool from its manifest.
# All manifest fields are already in scope (M_SLUG, M_TYPE, etc.)
# ---------------------------------------------------------------------
build_from_manifest() {
  local tool_root="$1"   # absolute path to the folder containing tool.json
  local slug="$M_SLUG"
  local name="$M_NAME"
  local type="$M_TYPE"
  local source_dir="$tool_root/$M_SOURCE_DIR"
  local dist="$M_DIST"
  local base_path="$M_BASE_PATH"
  local hide_api="$M_HIDE_API"
  local log_file="$LOG_DIR/$slug.log"

  if ! should_build "$slug"; then
    log "[$slug] skipped (ONLY_TOOL=$ONLY_TOOL)"
    return 0
  fi

  sec "Building: $name ($slug, type=$type)"
  log "dir:  $source_dir"
  log "log:  $log_file"

  if [ ! -d "$source_dir" ]; then
    err "[$slug] source directory missing: $source_dir"
    write_placeholder "$slug" "$name" "source directory missing"
    FAILED_TOOLS+=("$slug")
    return 0
  fi

  # ── Static tools: plain copy, no build ──
  if [ "$type" = "static" ]; then
    copy_to_out "$slug" "$source_dir"
    ok "[$slug] copied → $OUT_DIR/$slug"
    SUCCESS_TOOLS+=("$slug")
    return 0
  fi

  # ── Vite / Next.js: run the build in a subshell ──
  (
    set +e
    cd "$source_dir" || exit 97

    # Per-framework env wiring.
    case "$type" in
      vite)
        export BASE_PATH="$base_path"
        export VITE_BASE_PATH="$base_path"
        ;;
      next)
        # `basePath` without a trailing slash for Next.js.
        export NEXT_BASE_PATH="${base_path%/}"
        export NEXT_EXPORT=1
        ;;
    esac

    # HIDE_API=1 moves `src/app/api` aside for the build. Next.js
    # `output: "export"` chokes on API route handlers, so we swap them
    # out, run the build, and guarantee restoration via an EXIT trap.
    local api_hidden=""
    if [ "$hide_api" = "1" ] && [ -d src/app/api ]; then
      log "[$slug] hide_api=true → moving src/app/api aside"
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
      if [ $? -ne 0 ]; then
        err "[$slug] npm install failed"
        exit 98
      fi
    else
      log "[$slug] SKIP_INSTALL=1 → reusing existing node_modules"
    fi

    log "[$slug] running: $M_BUILD_CMD"
    if [ -n "${VERBOSE:-}" ]; then
      eval "$M_BUILD_CMD" 2>&1 | tee -a "$log_file"
      exit ${PIPESTATUS[0]}
    else
      eval "$M_BUILD_CMD" >> "$log_file" 2>&1
    fi
  )
  local rc=$?

  # Belt + braces: restore a hidden api folder from the parent shell in
  # case the subshell trap didn't run (e.g. SIGKILL).
  if [ -d "$source_dir/src/app/_api_hidden_for_export" ]; then
    mv "$source_dir/src/app/_api_hidden_for_export" "$source_dir/src/app/api" || true
  fi

  if [ $rc -ne 0 ]; then
    err "[$slug] build failed (rc=$rc) — writing placeholder"
    write_placeholder "$slug" "$name" "build exited with code $rc"
    FAILED_TOOLS+=("$slug")
    return 0
  fi

  local artifact="$source_dir/$dist"
  if [ ! -d "$artifact" ]; then
    err "[$slug] build finished but expected output missing: $artifact"
    write_placeholder "$slug" "$name" "missing build artifact: $dist"
    FAILED_TOOLS+=("$slug")
    return 0
  fi

  copy_to_out "$slug" "$artifact"
  ok "[$slug] built → $OUT_DIR/$slug"
  SUCCESS_TOOLS+=("$slug")
}

# =====================================================================
# 1. Root launcher — Overall Dashboard (vanilla HTML) + shared fonts
# =====================================================================
sec "Copying root: Overall Dashboard"
cp -a "$DASHBOARD_DIR"/. "$OUT_DIR"/

# The dashboard references the commentator tool's font/logo assets via
# a legacy relative path. A compat symlink in the source tree
# (Thmanyah-Commentator-Tool-.../ → tools/commentator/) keeps local dev
# working; here we replicate the same path in the deployed output so
# those relative URLs resolve at runtime too. The copy is cheap (~3MB)
# and self-contained to the commentator tool's own Usable/ folder.
LEGACY_COMMENTATOR_DIR="$OUT_DIR/Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh"
mkdir -p "$LEGACY_COMMENTATOR_DIR"
cp -a "$TOOLS_DIR/commentator/Usable" "$LEGACY_COMMENTATOR_DIR/"

# ── Shared Thmanyah font pool at the site root ──
# Every Next.js tool's CSS references fonts via absolute paths like
# `url('/fonts/Thmanyah*.otf')`. Vite rewrites those to include the
# tool's base path during build, but Next.js does NOT — so under
# subpath deploys the fonts 404 unless we also place them at the
# root-level `/fonts/` path. This copy makes absolute paths resolve
# regardless of which framework built the tool.
mkdir -p "$OUT_DIR/fonts"
cp -a "$TOOLS_DIR/commentator/Usable"/. "$OUT_DIR/fonts"/
# Drop anything that isn't a font or the brand logo, since /fonts/
# should behave like a clean font pool.
find "$OUT_DIR/fonts" -maxdepth 1 -type f ! -name '*.otf' ! -name '*.png' -delete 2>/dev/null || true

# Shared logo at the root so tools can reference it absolutely.
cp -f "$TOOLS_DIR/commentator/Usable/thamanyah.png" "$OUT_DIR/thamanyah.png" 2>/dev/null || true

ok "dashboard launcher + shared fonts in place"

# =====================================================================
# 2. Supabase credentials for the embedded tools
#
# Vite and Next.js inline `import.meta.env.*` / `process.env.NEXT_PUBLIC_*`
# at build time, so we export the unified Thmanyah project credentials
# here instead of sprinkling them across every tool.json. A Vercel
# project-level env var with the same name overrides the default.
# =====================================================================
: "${VITE_SUPABASE_URL:=https://hbnvbfcwrfanpayxulih.supabase.co}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:=sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv}"
export VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY

: "${NEXT_PUBLIC_SUPABASE_URL:=https://hbnvbfcwrfanpayxulih.supabase.co}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:=sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv}"
export NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY

log "Shared Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# =====================================================================
# 3. Build every tool under tools/ in manifest order
#
# Manifests are processed in alphabetical order of their directory
# name. That's stable across machines and means debugging logs line
# up. Tools are discovered by globbing `tools/*/tool.json` — drop a
# new folder with a manifest and it gets picked up automatically.
# =====================================================================
sec "Discovering tools under $TOOLS_DIR"
if [ ! -d "$TOOLS_DIR" ]; then
  err "tools directory missing: $TOOLS_DIR"
  exit 1
fi

# Collect manifest paths into a sorted array so we can iterate safely
# even on paths that contain spaces (old habits die hard).
shopt -s nullglob
manifests=( "$TOOLS_DIR"/*/tool.json )
shopt -u nullglob

if [ ${#manifests[@]} -eq 0 ]; then
  warn "No tool.json manifests found under $TOOLS_DIR"
fi

for manifest in "${manifests[@]}"; do
  tool_root="$( dirname "$manifest" )"
  if ! read_manifest "$manifest"; then
    err "Failed to parse $manifest — skipping"
    continue
  fi
  log "Found tool: $M_SLUG ($M_TYPE)"
  build_from_manifest "$tool_root"
done

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
