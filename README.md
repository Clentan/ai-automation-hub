# AI Automation Hub

**Live app:** [https://ai-automation-hub-1.replit.app](https://ai-automation-hub-1.replit.app)

One-click automations for everyday business work. The platform owner publishes ready-made n8n automation templates, and users connect to them with their own per-template API keys — no coding, no setup wizards.

## What it does

- **Template gallery** — browse a curated catalogue of business automations. Each one is built and tested by the platform owner.
- **Personal access keys** — every user gets their own key per template (`aah_tpl_...`, stored hashed, shown only once). Keys are revocable and tracked.
- **QCR Scan (live today)** — upload a PDF and get clean structured data back in seconds, powered by an n8n automation pipeline.
- **Run history** — every run is recorded and visible on web and mobile, so users always know what ran and what didn't.
- **Weekly digests** — a summary of activity delivered by email, with the schedule surviving server restarts.
- **Owner admin dashboard** — usage metrics, user and key management, and template requests at `/admin`.

## Start here

| Folder | What it is | Real source code |
| --- | --- | --- |
| [`Front-end`](Front-end) | React web app — gallery, flows, settings, admin dashboard | [`artifacts/automation-hub`](artifacts/automation-hub) |
| [`Back_end`](Back_end) | Python FastAPI API — auth, keys, runs, digests | [`artifacts/api-server`](artifacts/api-server) |
| [`Database`](Database) | PostgreSQL data layer — tables, schema, connection | [`lib/db`](lib/db) |

> `Front-end`, `Back_end`, and `Database` are navigation folders — each contains a README pointing to the working source. The runnable code stays under `artifacts/` and `lib/` because Replit's preview, workflows, and publishing are wired to those paths; moving it would break the running app.

## Project structure

| Folder | What it is |
| --- | --- |
| [`artifacts/automation-hub`](artifacts/automation-hub) | **Frontend (web app)** — React front-end (template gallery, flows, settings, admin dashboard) |
| [`artifacts/api-server`](artifacts/api-server) | **Backend (API server)** — Python FastAPI back-end (API routes, PostgreSQL, Clerk auth, admin API, digest scheduler) |
| [`artifacts/mobile`](artifacts/mobile) | **Mobile app** — Expo / React Native companion app (run history, templates) |
| [`artifacts/pitch-deck`](artifacts/pitch-deck) | **Pitch deck** — 10-slide investor presentation built with React |

Supporting folders:

| Folder | What it is |
| --- | --- |
| [`lib`](lib) | Shared libraries — database schema, API spec, generated API client and validation schemas |
| [`scripts`](scripts) | Workspace tooling and maintenance scripts |
| `attached_assets` | Images and files used by the apps (referenced from the web builds) |

Root files like `package.json`, `pnpm-workspace.yaml`, `pyproject.toml`, and `.replit` are workspace configuration that keeps all apps building and running on Replit.

## Tech stack

- **Front-end:** React, Vite, Tailwind CSS
- **Back-end:** Python, FastAPI, psycopg connection pool
- **Database:** PostgreSQL (Supabase)
- **Auth:** Clerk (session-based sign-in; JWKS verification on the server)
- **Automation engine:** n8n (templates run via webhooks)
- **Mobile:** Expo / React Native

## How a run works

1. **Browse** — pick an automation from the gallery
2. **Connect** — get your personal access key with one click
3. **Upload** — send in your document or data
4. **Results** — structured output back in seconds, recorded in your run history

## Reliability features

- Rate-limited run API
- Honest error handling — failures surface to the user instead of disappearing silently
- Database keep-alive heartbeat and startup connection fallback so the app stays up
- Weekly digest scheduler that resumes after restarts
