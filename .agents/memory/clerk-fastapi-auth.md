---
name: Clerk auth on the FastAPI api-server
description: Durable decisions for Clerk authentication in the Python backend
---

The shared api-server is Python/FastAPI, so the Clerk Express/JS templates don't apply — Clerk session JWTs are verified in Python against Clerk's JWKS, and the production-only Frontend API proxy is ported to a FastAPI route.

**Why:** Replit-managed Clerk assumes an Express server; this project's backend is FastAPI, so the canonical middleware/proxy had to be re-implemented rather than imported.

Admin access is email-based: `require_admin` accepts either a signed-in Clerk session whose primary email is in the `ADMIN_EMAILS` env var (comma-separated, lowercased) or the legacy `ADMIN_TOKEN` bearer. Admin endpoints return 404 (not 401/403) on denial to avoid revealing their existence.

**How to apply:** Keep proxied responses fully buffered (Content-Length set) — the deploy edge rejects chunked responses. The proxy returning 404 in development is intentional, not a bug. Template API keys are account-bound and stored hashed with reveal-once plaintext; a second issue for the same template must return 409 and the client regenerates instead. When minting test session JWTs, `POST /v1/sessions/{id}/tokens` requires `Content-Type: application/json` and a body (`{}`) or Clerk rejects it with unsupported_content_type.
