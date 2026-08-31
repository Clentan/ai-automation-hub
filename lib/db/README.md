# Database — Shared Database Package

This folder is the **database** package of the workspace (`@workspace/db`). It holds TypeScript/Drizzle tooling for describing the PostgreSQL schema and pushing schema changes.

## Where the real tables live today

The production schema is currently owned by the **backend**: the FastAPI server in [`../../artifacts/api-server`](../../artifacts/api-server) creates and migrates its tables on startup (`templates`, `user_api_keys`, `runs`, `template_requests`, `user_settings`, `digest_log`). This package's `src/schema` is scaffolding for any future TypeScript services that need typed access to the same database.

## What's here

| Path | What it is |
| --- | --- |
| `src/schema` | Drizzle table definitions (one file per table, exported from `index.ts`) |
| `drizzle.config.ts` | Configuration for pushing schema changes |

## Safe migration workflow

```bash
# Apply schema changes to the development database
pnpm --filter @workspace/db run push
```

Never point migrations at the production database directly — schema changes go to development first, then reach production through the normal publish flow.

## Connection

The database is PostgreSQL (Supabase). Connection strings are provided through environment variables (`SUPABASE_DB_URL` / `DATABASE_URL`) managed as Replit Secrets — no credentials are stored in this repository.
