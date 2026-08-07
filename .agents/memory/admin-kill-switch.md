---
name: Admin kill switch in dev env
description: ADMIN_DISABLED=1 makes all admin API endpoints return 404 even with a valid ADMIN_TOKEN.
---

The API server has an intentional kill switch: when the `ADMIN_DISABLED` env var is set, `require_admin` returns 404 for every admin endpoint, regardless of token or admin email.

**Why:** The owner uses it to preview the app as a regular user; it is currently set in the development environment.

**How to apply:** When an admin endpoint unexpectedly returns `{"detail":"Not found"}` with a valid `ADMIN_TOKEN`, check `ADMIN_DISABLED` first. To test admin routes without touching the user's env, run a throwaway uvicorn instance with `env -u ADMIN_DISABLED`.
