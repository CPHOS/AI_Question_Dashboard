#!/bin/sh
set -e

HTML_DIR=/usr/share/nginx/html
CONF=/etc/nginx/conf.d/default.conf

# ── Replace API base URL placeholder ────────────────
VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"
if [ -n "$VITE_API_BASE_URL" ]; then
  find "$HTML_DIR" -name '*.js' -exec \
    sed -i "s|__API_BASE__|${VITE_API_BASE_URL}|g" {} +
  echo "[entrypoint] Replaced __API_BASE__ with ${VITE_API_BASE_URL}"
else
  find "$HTML_DIR" -name '*.js' -exec \
    sed -i "s|__API_BASE__||g" {} +
  echo "[entrypoint] Replaced __API_BASE__ with '' (same-origin)"
fi

# ── Replace base path placeholder ───────────────────
BASE_PATH="${BASE_PATH:-}"
if [ -n "$BASE_PATH" ]; then
  BASE_PATH="/$(echo "$BASE_PATH" | sed 's|^/\+||;s|/\+$||')"
  REPLACEMENT="${BASE_PATH}/"
else
  REPLACEMENT="/"
fi

find "$HTML_DIR" \( -name '*.js' -o -name '*.html' -o -name '*.css' \) -exec \
  sed -i "s|/__BASE_PATH__/|${REPLACEMENT}|g" {} +
echo "[entrypoint] Replaced /__BASE_PATH__/ with ${REPLACEMENT}"

# ── Substitute BACKEND_URL into nginx config ────────
export BACKEND_URL="${BACKEND_URL:-http://backend:8000}"
envsubst '${BACKEND_URL}' < "$CONF" > "$CONF.tmp"
mv "$CONF.tmp" "$CONF"
echo "[entrypoint] nginx /api /health /version /docs -> ${BACKEND_URL}"
