# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run db:reset` — wipe operational data (bookings, quotes, drivers, vehicles, WhatsApp) for a clean test slate; add `-- --all` to also wipe the `services` catalog
- Required env: `DATABASE_URL` — Postgres connection string

## Deploy (Vercel)

One Vercel project serves both apps from a single domain:

- Static SPA (`carryfox`) built to `artifacts/carryfox/dist/public`
- Express API wrapped as a serverless function at `api/[[...path]].ts` (all `/api/*`)
- `vercel.json` wires the build, output dir, SPA fallback rewrite, and function config

Steps: import the repo in Vercel (defaults are picked up from `vercel.json`), set the env vars from `.env.example` in Project Settings, and point `DATABASE_URL` at a hosted Postgres with a **pooled** connection string (Neon/Supabase pooler) — the API runs as serverless functions, each with its own pool. Clerk works without the `/api/__clerk` proxy on Vercel, so leave `VITE_CLERK_PROXY_URL` unset. Health check: `GET /api/healthz`.

Note: the pnpm overrides strip all platform-specific native binaries (esbuild/rollup/tailwind oxide/lightningcss) from their parents; the root package.json pins the needed ones directly (`win32-x64` for local Windows dev, `linux-x64-gnu` for Vercel/Linux). If you build on another platform, add its pin there too.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
