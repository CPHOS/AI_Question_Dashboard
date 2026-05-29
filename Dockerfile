# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (cached when lockfile unchanged)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the SPA
COPY . .
# VITE_* vars are inlined at build time; leave empty to use same-origin /api (proxied by nginx).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# SPA + reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# The backend host the nginx proxy forwards /api and /health to.
# Override at runtime: -e BACKEND_URL=http://my-backend:8000
ENV BACKEND_URL=http://backend:8000

# Substitute ${BACKEND_URL} into the nginx template on container start.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-backend-url.sh
RUN chmod +x /docker-entrypoint.d/40-backend-url.sh

EXPOSE 80
