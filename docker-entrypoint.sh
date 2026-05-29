#!/bin/sh
# Substitute runtime environment variables into the nginx site config.
# Runs automatically via /docker-entrypoint.d before nginx starts.
set -e

CONF=/etc/nginx/conf.d/default.conf

# Only substitute the variables we control to avoid clobbering nginx's own $vars.
envsubst '${BACKEND_URL}' < "$CONF" > "$CONF.tmp"
mv "$CONF.tmp" "$CONF"

echo "[entrypoint] nginx proxying /api and /health -> ${BACKEND_URL}"
