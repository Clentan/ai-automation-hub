# Frontend — AI Automation Hub Web App

This folder is the **frontend**: the React web app users see in the browser — the template gallery, flows, activity, learn page, settings, and the owner admin dashboard.

## Tech

- React 19 + TypeScript
- Vite (dev server and build)
- Tailwind CSS
- Wouter (routing), TanStack Query

## Folder map

| Path | What it is |
| --- | --- |
| `src/pages` | One file per screen (gallery, my flows, activity, learn, admin, sign-in) |
| `src/components` | Reusable UI pieces shared across pages |
| `src/lib` | Data helpers — API calls, template cache, API-key hooks |
| `src/hooks` | Reusable React hooks |
| `public` | Static files served as-is |

## How it talks to the backend

All data comes from the FastAPI backend under the `/api` prefix (see [`../Back_end`](../Back_end)). Requests are sent with the app's base URL prefix so they work in every environment. Sign-in uses Clerk; the browser session cookie is verified by the backend.

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter @workspace/automation-hub run dev
```

On Replit this runs automatically via the "artifacts/automation-hub: web" workflow.
