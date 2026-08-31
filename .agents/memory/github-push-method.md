---
name: GitHub push method
description: How to push this repl's code to GitHub (CLI push fails; use Git Data API)
---
`git push` fails (no auth). Working method: GitHub connector `proxyFetch` with the Git Data API — get remote head, diff local `git ls-files -s` shas against the remote recursive tree, upload only changed blobs (base64), create tree with `base_tree`, commit with remote head as parent, PATCH the ref.
**Why:** local and remote histories have diverged permanently (same content, different SHAs), so contents-API single-file pushes or full trees without base_tree hit conflicts/422s.
**How to apply:** proxy is rate-limited to 10 RPS per repl — throttle blob uploads (concurrency ~3 + sleep) and retry 429s. Repo: Clentan/ai-automation-hub, branch main.

**Path mapping (permanent):** GitHub presents `artifacts/automation-hub` as `Front-end/`, `artifacts/api-server` as `Back_end/`, and `lib/db` as `Database/` (user-requested layout; Replit keeps working copies under artifacts/ and lib/). EVERY push must apply this local→repo path remap when diffing and building the tree, or the structure regresses.

**Blob-reuse trick:** the proxy's WAF sometimes 403-blocks blob POSTs for certain file contents (HTML pages especially). Skip uploads for any local file whose git blob sha already exists anywhere in the remote tree — reference the sha directly in the new tree. Only genuinely new content needs uploading.
