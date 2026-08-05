# Memory Index

- [api-server is FastAPI, not Express](api-server-fastapi.md) — shared `/api` artifact runs Python/uvicorn; routes live in main.py and must include the /api prefix.
- [Frontend auth-probe caching](frontend-auth-probe-caching.md) — cache client-side "is admin" probes per user id, or a pre-sign-in `false` sticks after login.
- [GitHub two-folder repo layout](github-two-folder-repo.md) — repo shows only Front-end/ and Back-End/; never push workspace main directly, sync via Git Data API transform.
- [Clerk auth on FastAPI](clerk-fastapi-auth.md) — JWKS-based session verification in Python, ported prod proxy, and how to mint test session JWTs via the Clerk Backend API.
