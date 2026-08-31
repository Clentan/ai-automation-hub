# Database — Where the Data Lives

This project's database is **PostgreSQL** (Supabase in production). This folder (`@workspace/db`) is currently **empty scaffolding** — a placeholder Drizzle/TypeScript package with no table definitions yet. It exists so future TypeScript services can share typed schema definitions, but nothing uses it today.

> **Dual layout:** on GitHub this folder is published as `Database/`; in the Replit workspace it lives at `lib/db/`. Relative links in this README (e.g. `../Back_end`) target the GitHub layout — locally, the backend is at `../../artifacts/api-server`.

## Where the real schema lives

The schema is owned by the **backend**: the FastAPI server in [`../Back_end`](../Back_end) creates its tables on startup with `CREATE TABLE IF NOT EXISTS` statements in `main.py`:

| Table | Purpose |
| --- | --- |
| `templates` | The automation template catalogue (managed by the owner) |
| `user_api_keys` | Per-template access keys, stored as SHA-256 hashes |
| `runs` | Every template run, for run history |
| `template_requests` | User requests for new templates |
| `user_settings` | Per-user preferences (e.g. digest settings) |
| `digest_log` | Record of sent weekly digest emails |

## How schema changes are made

1. Edit the `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` startup statements in the backend's `main.py` (the `Back_end` folder on GitHub; `artifacts/api-server` in the Replit workspace) — write them so re-running is harmless.
2. Restart the API server — it applies the change to the development database on startup.
3. When the app is published, the production server runs the same startup statements against the production database on its first boot.

There is no separate migration tool in use. The `drizzle-kit push` script in this package is part of the unused scaffolding — do not use it unless Drizzle schemas are actually added here first.

## Connection

Connection strings come from environment variables (`SUPABASE_DB_URL` / `SUPABASE_DB_PASSWORD`, with `DATABASE_URL` as fallback) managed as Replit Secrets — no credentials are stored in this repository.
