---
name: GitHub push method
description: How to push this repl's code to GitHub (CLI push fails; use Git Data API)
---
`git push` fails (no auth). Working method: GitHub connector `proxyFetch` with the Git Data API — get remote head, diff local `git ls-files -s` shas against the remote recursive tree, upload only changed blobs (base64), create tree with `base_tree`, commit with remote head as parent, PATCH the ref.
**Why:** local and remote histories have diverged permanently (same content, different SHAs), so contents-API single-file pushes or full trees without base_tree hit conflicts/422s.
**How to apply:** proxy is rate-limited to 10 RPS per repl — throttle blob uploads (concurrency ~3 + sleep) and retry 429s. Repo: Clentan/ai-automation-hub, branch main.
