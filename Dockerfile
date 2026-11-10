# syntax=docker/dockerfile:1

# ---- deps: dependências (também é o alvo do compose.dev.yml) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

# ---- build: gera os estáticos com o Vite ----
FROM deps AS build

COPY . .

# Vazio = chamadas relativas (/api/...), atendidas pelo proxy do nginx abaixo.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN yarn build

# ---- runtime: nginx sem root servindo a SPA ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Destino do proxy /api — o template é processado por envsubst na inicialização.
ENV BACKEND_URL=http://backend:6767

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/"]
