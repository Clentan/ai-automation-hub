---
name: Clerk auth on the FastAPI api-server
description: Durable decisions for Clerk authentication in the Python backend
---

The shared api-server is Python/FastAPI, so the Clerk Express/JS templates don't apply — Clerk session JWTs are verified in Python against Clerk's JWKS, and the production-only Frontend API proxy is ported to a FastAPI route.

**Why:** Replit-managed Clerk assumes an Express server; this project's backend is FastAPI, so the canonical middleware/proxy had to be re-implemented rather than imported.

**How to apply:**
- Keep proxied responses fully buffered (Content-Length set) — the deploy edge rejects chunked responses.
- The proxy returning 404 in development is intentional, not a bug.
- Template API keys are account-bound, stored hashed, with reveal-once plaintext; a second issue for the same template returns 409 and the client regenerates instead.
- Admin access is email-based: `require_admin` accepts either a signed-in Clerk session whose primary email is in the `ADMIN_EMAILS` env var (comma-separated, lowercased) or a legacy `ADMIN_TOKEN` bearer. Admin endpoints return 404 on denial to avoid revealing their existence.
- The app now prefers the owner's OWN Clerk application over Replit-managed Clerk: `OWN_CLERK_SECRET_KEY` secret (backend) and `VITE_OWN_CLERK_PUBLISHABLE_KEY` / `EXPO_PUBLIC_OWN_CLERK_PUBLISHABLE_KEY` env vars (frontends). When the own key is set, the frontend-API proxy is bypassed (proxyUrl undefined). Currently on dev (pk_test) keys; live keys needed before public launch. Old Replit-managed accounts did not transfer.
- When minting test session JWTs via the Clerk Backend API, `POST /v1/sessions/{id}/tokens` requires `Content-Type: application/json` with a body of `{}` — omitting it returns `unsupported_content_type`.
