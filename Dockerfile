FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
ARG VITE_API_BASE_URL=__API_BASE__
ARG VITE_BASE_PATH=/__BASE_PATH__/
RUN npm run build

FROM nginx:stable-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/docker-entrypoint.sh /docker-entrypoint.d/40-subst-env.sh
RUN chmod +x /docker-entrypoint.d/40-subst-env.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
