# syntax=docker/dockerfile:1

# ---- build: static assets ----
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime: nginx serves the SPA and proxies /api ----
FROM nginx:1.27-alpine
ENV API_UPSTREAM=http://api:8000 \
    NGINX_RESOLVER=127.0.0.11 \
    NGINX_ENVSUBST_FILTER="^(API_UPSTREAM|NGINX_RESOLVER)$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx-api-proxy.conf /etc/nginx/snippets/api-proxy.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
