#!/usr/bin/env bash
# =====================================================================
# scripts/new-tool.sh — scaffold a new tool under tools/<slug>/.
# =====================================================================
#
# Adding a tool to the monorepo is a two-step ritual:
#   1. Create `tools/<slug>/tool.json` with slug/type/basePath/…
#   2. Drop the tool's source into that folder.
#
# This script automates step 1 for the three supported tool types
# (static, vite, next) and writes a minimal working index.html so
# `build.sh` picks the new tool up on the next deploy. Edit the
# scaffold afterwards — it's intentionally tiny, not a template.
#
# Usage:
#   scripts/new-tool.sh <slug> <type> ["name_en"] ["name_ar"]
#
# Examples:
#   scripts/new-tool.sh sponsor-tracker static "Sponsor Tracker" "تتبع الرعاة"
#   scripts/new-tool.sh listener-map     vite
#
# The slug becomes the folder name and the URL path (/<slug>/). Use
# lowercase kebab-case — no spaces, no underscores, nothing fancy.
# =====================================================================

set -euo pipefail

if [ $# -lt 2 ]; then
  cat <<USAGE
Usage: $0 <slug> <type> [name_en] [name_ar]

Arguments:
  slug     lowercase kebab-case identifier (e.g. 'sponsor-tracker')
  type     one of: static | vite | next
  name_en  optional English display name (defaults to the slug)
  name_ar  optional Arabic display name  (defaults to the slug)
USAGE
  exit 64
fi

SLUG="$1"
TYPE="$2"
NAME_EN="${3:-$SLUG}"
NAME_AR="${4:-$SLUG}"

case "$TYPE" in
  static|vite|next) : ;;
  *) echo "error: type must be one of static|vite|next (got '$TYPE')" >&2; exit 64 ;;
esac

if [[ ! "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "error: slug must be lowercase kebab-case (got '$SLUG')" >&2
  exit 64
fi

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
DEST="$REPO_ROOT/tools/$SLUG"

if [ -e "$DEST" ]; then
  echo "error: $DEST already exists — refusing to overwrite" >&2
  exit 73
fi

mkdir -p "$DEST"
echo "→ $DEST"

case "$TYPE" in
  static)
    cat > "$DEST/tool.json" <<EOF
{
  "slug": "$SLUG",
  "name": "$NAME_EN",
  "nameAr": "$NAME_AR",
  "type": "static",
  "sourceDir": ".",
  "basePath": "/$SLUG"
}
EOF
    cat > "$DEST/index.html" <<EOF
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>$NAME_AR</title>
  <style>body{font-family:system-ui,sans-serif;padding:32px;background:#F7F4EE;}</style>
</head>
<body>
  <h1>$NAME_AR</h1>
  <p>$NAME_EN — scaffold. Replace this file with the real tool.</p>
</body>
</html>
EOF
    ;;

  vite)
    cat > "$DEST/tool.json" <<EOF
{
  "slug": "$SLUG",
  "name": "$NAME_EN",
  "nameAr": "$NAME_AR",
  "type": "vite",
  "sourceDir": "app",
  "dist": "dist",
  "buildCmd": "npm run build",
  "basePath": "/$SLUG/"
}
EOF
    mkdir -p "$DEST/app"
    echo "→ created tool.json; run 'npm create vite@latest $SLUG -- --template react-ts' inside $DEST/app and wire the 'base' in vite.config.ts to process.env.VITE_BASE_PATH."
    ;;

  next)
    cat > "$DEST/tool.json" <<EOF
{
  "slug": "$SLUG",
  "name": "$NAME_EN",
  "nameAr": "$NAME_AR",
  "type": "next",
  "sourceDir": "app",
  "dist": "out",
  "buildCmd": "npm run build && next export",
  "basePath": "/$SLUG",
  "hideApi": true
}
EOF
    mkdir -p "$DEST/app"
    echo "→ created tool.json; run 'npx create-next-app@latest app' inside $DEST and wire next.config.ts basePath to process.env.NEXT_BASE_PATH."
    ;;
esac

# Register the tool in the dashboard's static fallback registry so it
# shows up even before the `tools` table is populated. The edit is
# intentionally permissive — we search for the closing bracket of the
# STATIC_TOOLS array and splice a new entry right before it.
TOOLS_JS="$REPO_ROOT/Overall-Dashboard/tools.js"
if [ -f "$TOOLS_JS" ] && ! grep -q "slug: '$SLUG'" "$TOOLS_JS"; then
  echo "→ reminder: add an entry to STATIC_TOOLS in $TOOLS_JS"
  echo "   Example: { slug: '$SLUG', name_en: '$NAME_EN', name_ar: '$NAME_AR', enabled: true, icon: 'layout-grid', url: '/$SLUG/' }"
fi

echo
echo "✓ scaffolded $SLUG ($TYPE)"
echo "  next: edit $DEST/tool.json, drop the real source in, and run build.sh"
