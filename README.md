# AI Automation Hub

An automation template gallery: the owner publishes n8n automation templates, and users connect to them with per-template API keys.

## Project structure

| Folder | What it is |
| --- | --- |
| [`artifacts/automation-hub`](artifacts/automation-hub) | **Front-end** — React web app (pages, components, styling, admin dashboard) |
| [`artifacts/api-server`](artifacts/api-server) | **Back-end** — Python FastAPI server (API routes, PostgreSQL database, Clerk auth, admin API) |

Other folders (`packages/`, `scripts/`, etc.) are shared tooling used by both.

## Highlights

- Template gallery with per-template API keys (`aah_tpl_...`, stored hashed, reveal-once)
- Clerk sign-in; keys are bound to the signed-in account
- Owner admin dashboard at `/admin` (usage metrics, template requests, issued keys)
- Rate-limited run API
