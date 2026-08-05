#!/bin/bash
set -e
# JS deps: merged tasks may change package.json, so don't require a frozen lockfile.
pnpm install --no-frozen-lockfile
# Python deps for the FastAPI api-server (pyproject.toml + uv.lock at repo root).
uv sync
