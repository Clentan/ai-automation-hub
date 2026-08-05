# AI Automation Hub

A frontend-only React web app for browsing AI automation templates, creating flows from them, and managing flows — inspired by Power Automate's template gallery.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

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

- `/` Template gallery: search, category tabs, sort, template detail dialog with "Use this template"
- `/my-flows` Flows created from templates: toggle on/off, rename, delete (persisted in localStorage)
- `/activity` Mocked recent-run activity feed
- `/api-access` Personal API key (simulated, localStorage), connect instructions, plan tiers (Free current; Pro/Team "coming soon")
- All data is client-side mock data in `artifacts/automation-hub/src/lib/data.ts`; no backend/database is used (user requested frontend only).
- Business model: owner publishes their n8n automation templates; users connect via API keys; subscription-based later, free for now. Templates are authored by "AI Automation Hub" and powered by n8n.
- Access model (user's choice): SEPARATE KEY PER TEMPLATE. Each template has a "Request API key" button; keys are stored per template (localStorage 'ai-automation-hub-template-keys', managed via src/lib/use-api-keys.ts) and can be copied/regenerated/revoked on /api-access.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
