# Backend — FastAPI API Server

This folder is the **backend**: a Python FastAPI service that owns all data and business logic. Every route lives under the `/api` prefix.

## What it handles

- **Templates catalogue** — public `GET /api/templates`; the owner manages templates through `/api/admin/templates`
- **Per-template API keys** — issued per user, stored as SHA-256 hashes (`aah_tpl_...` shown once), revocable
- **Template runs** — `POST /api/v1/templates/{id}/run` validates the caller's key and forwards the job to the n8n automation engine via webhook
- **Authentication** — Clerk session cookies verified server-side with JWKS; a production Clerk proxy lives at `/api/__clerk`
- **Admin API** — usage metrics, users, keys, and template requests (token-protected)
- **Weekly digest scheduler** — background loop that survives restarts
- **Database keep-alive** — periodic heartbeat plus a startup connection fallback

## Configuration (names only — values live in Replit Secrets, never in code)

| Variable | Purpose |
| --- | --- |
| `SUPABASE_DB_URL` / `SUPABASE_DB_PASSWORD` | Primary PostgreSQL connection (Supabase) |
| `DATABASE_URL` | Fallback PostgreSQL connection |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | Clerk authentication |
| `N8N_WEBHOOK_URL` | n8n automation webhook endpoint |
| `ADMIN_TOKEN` | Protects the admin API |

## Database

The server connects to PostgreSQL with a psycopg connection pool and creates its own tables on startup (`CREATE TABLE IF NOT EXISTS` in `main.py`): `templates`, `user_api_keys`, `runs`, `template_requests`, `user_settings`, and `digest_log`. See [`../Database`](../Database) for the full database guide.

## Run it

From the repository root:

```bash
pnpm --filter @workspace/api-server run dev
```

On Replit this runs automatically via the "artifacts/api-server: API Server" workflow. Python dependencies are declared in the root `pyproject.toml`.
