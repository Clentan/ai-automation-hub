---
name: api-server is FastAPI, not Express
description: The shared api-server artifact was converted from the Express scaffold to a Python FastAPI service
---

The `artifacts/api-server` artifact (routed at `/api`, port 8080) runs **FastAPI/uvicorn**, not the stock Express scaffold — the TS sources were deleted and `package.json` dev/start scripts run uvicorn.

**Why:** User explicitly requested a Python FastAPI backend for the AI Automation Hub.

**How to apply:**
- Add backend routes in `artifacts/api-server/main.py` (all routes must include the `/api` prefix themselves — the proxy does not strip it).
- Changing the run command in `.replit-artifact/artifact.toml` must go through `verifyAndReplaceArtifactToml` (production run uses `uvicorn --app-dir artifacts/api-server`; health check `/api/healthz`).
- Storage is SQLite at `artifacts/api-server/data/hub.db` (gitignored, ephemeral in production — a durable-DB follow-up task exists). Schema changes need manual migration or deleting the dev db.
- Frontend identity is an anonymous `X-Client-Id` from localStorage (`getClientId()` in `automation-hub/src/lib/use-api-keys.ts`); there is no real auth yet, so don't present key management as account-secure.
