---
name: GitHub two-folder repo layout
description: The GitHub repo does NOT mirror the workspace — it shows only Front-end/ and Back-End/; pushes need a transform.
---

The user's GitHub repo (Clentan/ai-automation-hub, private) intentionally shows only two folders: `Front-end/` (= `artifacts/automation-hub`) and `Back-End/` (= `artifacts/api-server`). No README, no other root files — user explicitly demanded "only two folders".

**Why:** User wants a clean two-folder view; renaming workspace dirs would break artifact routing/workflows.

**How to apply:** Never `gitPush` the workspace main directly — it would overwrite the curated layout. To sync: push workspace main first is NOT needed if blobs unchanged remotely — instead build the layout with GitHub's Git Data API using local subtree SHAs (`git rev-parse main:artifacts/automation-hub` etc.): POST /git/trees with two tree entries, POST /git/commits (parent = remote head), PATCH /git/refs/heads/main force. Subtree SHAs must already exist on the remote — if they don't (new/changed files), push the full workspace to a side branch (e.g. `workspace-mirror`) first to upload objects, then rewrite main via the API. Also note: the `gitPush` callback cannot push a non-checked-out branch, and force-pushing rewritten history returned BRANCH_ALREADY_EXISTS.
