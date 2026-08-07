---
name: n8n webhook reachability
description: The n8n instance's real address, the dead domain, and the env override pattern
---

The user's n8n runs on a Bluehost VPS reachable **only by IP** (`http://129.121.121.76`). The domain in the original webhook URL (clentanclentan.com) is **unregistered** — NXDOMAIN at the .com registry — so any URL on it fails everywhere, not just in the sandbox.

**Why:** Earlier notes blamed sandbox DNS; actually the domain never existed. The production webhook path (`/webhook/<id>`) on the IP works and the workflow is Active. `/webhook-test/` paths only accept one request while the n8n editor is listening.

**How to apply:**
- The api-server reads `N8N_WEBHOOK_URL_OVERRIDE` (plain env var, set in development + production) in preference to the `N8N_WEBHOOK_URL` secret, because the secret form kept retaining the stale value even after the user "updated" it twice.
- If the user later gets a real domain + HTTPS for their VPS, update the override (or remove it and fix the secret).
- To change the target: update the env var, restart `artifacts/api-server: API Server`, then verify by minting a Clerk session token, regenerating a t-21 key, and POSTing a small PDF to `/api/v1/templates/t-21/run` — expect `status: succeeded`.
