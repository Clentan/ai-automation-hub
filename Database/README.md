# Database

The data layer — PostgreSQL (Supabase in production) storing templates, API keys, runs, user settings, and digest history.

**➡️ Details: [`../lib/db`](../lib/db)** ([full guide](../lib/db/README.md))

The tables themselves are created by the backend on startup — see the [Back_end](../Back_end) folder and [`../artifacts/api-server`](../artifacts/api-server). Connection strings live in Replit Secrets; no credentials are stored in this repository.

> **Why isn't the schema inside this folder?** The backend owns and creates the tables, and shared packages must live under `lib/` for the Replit workspace to build. This folder is the sign-post; the links above are the source of truth.
