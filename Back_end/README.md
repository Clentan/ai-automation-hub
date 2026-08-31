# Back_end

The server side — a Python FastAPI service that owns all data and business logic: authentication, per-template API keys, template runs, the admin API, and weekly digest emails.

**➡️ Source code: [`../artifacts/api-server`](../artifacts/api-server)** ([full guide](../artifacts/api-server/README.md))

Built with Python 3.11, FastAPI, and a psycopg PostgreSQL connection pool. All routes live under `/api`.

> **Why isn't the code inside this folder?** This project runs on Replit, which requires each runnable app to live under `artifacts/`. Moving the code here would break the live preview and publishing. This folder is the sign-post; the link above is the code.
