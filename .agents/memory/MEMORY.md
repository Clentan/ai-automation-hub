# Memory Index

- [api-server is FastAPI, not Express](api-server-fastapi.md) — shared `/api` artifact runs Python/uvicorn; routes live in main.py and must include the /api prefix.
- [Frontend auth-probe caching](frontend-auth-probe-caching.md) — cache client-side "is admin" probes per user id, or a pre-sign-in `false` sticks after login.
- [n8n webhook reachability](n8n-webhook-reachability.md) — n8n lives at a bare VPS IP; original domain is unregistered (NXDOMAIN); server prefers `N8N_WEBHOOK_URL_OVERRIDE` env var over the stale secret.
- [Clerk auth on FastAPI](clerk-fastapi-auth.md) — JWKS-based session verification in Python, ported prod proxy, and how to mint test session JWTs via the Clerk Backend API.
