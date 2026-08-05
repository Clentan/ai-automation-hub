---
name: Frontend auth-probe caching
description: Session-cached "am I admin?" probes must be keyed per user id
---
Any client-side cached authorization probe (e.g. sessionStorage "is admin" flag) must include the signed-in user id in its cache key.

**Why:** A probe cached while anonymous (or under another account) otherwise sticks after sign-in — the owner saw no Admin link because `false` was cached before they logged in.

**How to apply:** Key both the sessionStorage entry and any in-flight promise cache by Clerk user id; clear all such keys on sign-out.
