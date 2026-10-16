# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Multi-stage build for the Carryfox stack (see DEPLOY.md).
#
#   builder  → installs the workspace, typechecks, builds API + SPA
#   api      → lean runtime image running the Express bundle (dist/index.mjs)
#   frontend → Caddy serving the built SPA and proxying /api/* to the api
#
# Build both images via `docker compose up --build` (targets selected there).
# ---------------------------------------------------------------------------

FROM node:24-bookworm-slim AS builder

# Pin matches the root package.json "packageManager" field.
RUN npm install -g pnpm@11.4.0

WORKDIR /app

# Workspace manifests first, so `pnpm install` is layer-cached: dependency
# installs only re-run when package.json / pnpm-lock.yaml change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/carryfox/package.json artifacts/carryfox/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/db/package.json lib/db/
COPY scripts/package.json scripts/

RUN pnpm install --frozen-lockfile

# Inlined into the frontend bundle at build time (App.tsx throws without it).
# Provided via docker-compose build args from the repo .env file.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

COPY . .

RUN pnpm run typecheck \
  && pnpm --filter @workspace/api-server run build \
  && pnpm --filter @workspace/carryfox run build

# --------------------------------------------------------------------------
# API runtime image
# --------------------------------------------------------------------------
FROM node:24-bookworm-slim AS api

ENV NODE_ENV=production PORT=8080
WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist

EXPOSE 8080
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.mjs"]

# --------------------------------------------------------------------------
# Frontend runtime image: Caddy serves the static SPA + reverse-proxies /api
# --------------------------------------------------------------------------
FROM caddy:2 AS frontend

COPY --from=builder /app/artifacts/carryfox/dist /site
COPY Caddyfile /etc/caddy/Caddyfile
