"""AI Automation Hub - FastAPI backend.

Serves under the /api path prefix (routed by the workspace proxy).
Stores template API keys, template requests, and run logs in PostgreSQL
(DATABASE_URL) so data survives redeploys.

Auth: Clerk sessions (cookie `__session` in the browser, or Authorization
Bearer for non-browser clients). Template API keys are bound to the Clerk
user id, stored hashed (SHA-256); plaintext is returned only when issued
or regenerated.
"""
import hashlib
import os
import re
import secrets
import time
import uuid
from contextlib import contextmanager
from typing import Optional

import httpx
import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pydantic import BaseModel, Field

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required")

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=10, kwargs={"row_factory": dict_row})

app = FastAPI(title="AI Automation Hub API", docs_url="/api/docs", openapi_url="/api/openapi.json")

# The frontend is served same-origin through the workspace proxy, so no
# cross-origin access is required or allowed.

# Server-side template catalog: keys can only be issued for these ids.
# Keep in sync with the frontend catalog in artifacts/automation-hub/src/lib/data.ts.
KNOWN_TEMPLATE_IDS = {f"t-{i}" for i in range(1, 21)}


@contextmanager
def db():
    with pool.connection() as conn:
        yield conn


def init_db() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_api_keys (
                user_id     TEXT NOT NULL,
                template_id TEXT NOT NULL,
                key_hash    TEXT NOT NULL UNIQUE,
                key_prefix  TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                PRIMARY KEY (user_id, template_id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS template_requests (
                id          TEXT PRIMARY KEY,
                client_id   TEXT,
                title       TEXT NOT NULL,
                tools       TEXT,
                description TEXT NOT NULL,
                created_at  TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS runs (
                id          TEXT PRIMARY KEY,
                template_id TEXT NOT NULL,
                client_id   TEXT NOT NULL,
                status      TEXT NOT NULL,
                created_at  TEXT NOT NULL
            )
            """
        )
        # Migration: add status column to template_requests if missing.
        conn.execute(
            "ALTER TABLE template_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'"
        )
        # Legacy anonymous keys (bound to per-browser client ids, stored in
        # plaintext) can't be mapped to accounts; drop the old table.
        conn.execute("DROP TABLE IF EXISTS api_keys")


init_db()

REQUEST_STATUSES = {"new", "reviewed", "planned", "done"}

TEMPLATE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# --------------------------------------------------------------------------
# Clerk configuration
# --------------------------------------------------------------------------

CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")
CLERK_API = "https://api.clerk.com"

_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
JWKS_TTL = 3600.0

# Clerk Frontend API proxy (production only)
CLERK_FAPI = "https://frontend-api.clerk.dev"
CLERK_PROXY_PATH = "/api/__clerk"
IS_PRODUCTION = bool(os.environ.get("REPLIT_DEPLOYMENT"))

_HOP_BY_HOP = {
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
}


def _verify_session_token(token: str) -> str:
    """Verifies a Clerk session JWT and returns the user id (sub)."""
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        jwks = _get_jwks()
        key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key = jwt.PyJWK(k).key
                break
        if key is None:
            # Key rotation: refresh JWKS once.
            _jwks_cache["fetched_at"] = 0.0
            jwks = _get_jwks()
            for k in jwks.get("keys", []):
                if k.get("kid") == kid:
                    key = jwt.PyJWK(k).key
                    break
        if key is None:
            raise HTTPException(status_code=401, detail="Unknown signing key")
        claims = jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=10,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user_id

def require_user(request: Request) -> str:
    """FastAPI dependency: returns the authenticated Clerk user id."""
    token = request.cookies.get("__session")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    return _verify_session_token(token)

def key_prefix(key: str) -> str:
    return key[:12]

class KeyMeta(BaseModel):
    templateId: str
    keyPrefix: str
    createdAt: str

class KeyIssued(KeyMeta):
    # Plaintext key — only present in the issue/regenerate response.
    key: str


def _get_jwks() -> dict:
    now = time.monotonic()
    if _jwks_cache["keys"] and now - _jwks_cache["fetched_at"] < JWKS_TTL:
        return _jwks_cache["keys"]
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Auth is not configured")
    resp = httpx.get(
        f"{CLERK_API}/v1/jwks",
        headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        timeout=10,
    )
    resp.raise_for_status()
    _jwks_cache["keys"] = resp.json()
    _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]
def check_template_id(template_id: str) -> str:
    if not TEMPLATE_ID_RE.match(template_id) or template_id not in KNOWN_TEMPLATE_IDS:
        raise HTTPException(status_code=404, detail="Unknown template id")
    return template_id


def new_key() -> str:
    return f"aah_tpl_{secrets.token_hex(16)}"

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()
class IssueKeyIn(BaseModel):
    templateId: str = Field(min_length=1, max_length=64)


class TemplateRequestIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    tools: str = Field(default="", max_length=300)
    description: str = Field(min_length=1, max_length=3000)
@app.get("/api/healthz")
def healthz():
    return {"ok": True}

@app.get("/api/me")
def me(user_id: str = Depends(require_user)):
    return {"userId": user_id}
@app.get("/api/keys", response_model=list[KeyMeta])
def list_keys(user_id: str = Depends(require_user)):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM user_api_keys WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return [
        KeyMeta(templateId=r["template_id"], keyPrefix=r["key_prefix"], createdAt=r["created_at"])
        for r in rows
    ]


@app.post("/api/keys", response_model=KeyIssued)
def issue_key(body: IssueKeyIn, user_id: str = Depends(require_user)):
    template_id = check_template_id(body.templateId)
    with db() as conn:
        existing = conn.execute(
            "SELECT * FROM user_api_keys WHERE user_id = %s AND template_id = %s",
            (user_id, template_id),
        ).fetchone()
        if existing:
            # A key already exists; the plaintext is unrecoverable by design.
            raise HTTPException(
                status_code=409,
                detail="A key already exists for this template. Regenerate it to get a new one.",
            )
        created = now_iso()
        key = new_key()
        # Atomic: concurrent requests for the same (user, template) keep the first key.
        conn.execute(
            "INSERT INTO user_api_keys (user_id, template_id, key_hash, key_prefix, created_at) "
            "VALUES (%s, %s, %s, %s, %s) ON CONFLICT (user_id, template_id) DO NOTHING",
            (user_id, template_id, hash_key(key), key_prefix(key), created),
        )
        row = conn.execute(
            "SELECT * FROM user_api_keys WHERE user_id = %s AND template_id = %s",
            (user_id, template_id),
        ).fetchone()
        if row["key_hash"] != hash_key(key):
            # Lost a concurrent insert race; the winner holds the plaintext.
            raise HTTPException(status_code=409, detail="A key already exists for this template.")
    return KeyIssued(templateId=template_id, key=key, keyPrefix=key_prefix(key), createdAt=created)


@app.post("/api/keys/{template_id}/regenerate", response_model=KeyIssued)
def regenerate_key(template_id: str, user_id: str = Depends(require_user)):
    template_id = check_template_id(template_id)
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM user_api_keys WHERE user_id = %s AND template_id = %s",
            (user_id, template_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No key for this template")
        created = now_iso()
        key = new_key()
        conn.execute(
            "UPDATE user_api_keys SET key_hash = %s, key_prefix = %s, created_at = %s "
            "WHERE user_id = %s AND template_id = %s",
            (hash_key(key), key_prefix(key), created, user_id, template_id),
        )
    return KeyIssued(templateId=template_id, key=key, keyPrefix=key_prefix(key), createdAt=created)


@app.delete("/api/keys/{template_id}", status_code=204)
def revoke_key(template_id: str, user_id: str = Depends(require_user)):
    template_id = check_template_id(template_id)
    with db() as conn:
        conn.execute(
            "DELETE FROM user_api_keys WHERE user_id = %s AND template_id = %s",
            (user_id, template_id),
        )
    return None


@app.post("/api/template-requests", status_code=201)
def create_template_request(body: TemplateRequestIn, user_id: str = Depends(require_user)):
    request_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute(
            "INSERT INTO template_requests (id, client_id, title, tools, description, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (
                request_id,
                user_id,
                body.title.strip(),
                body.tools.strip(),
                body.description.strip(),
                now_iso(),
            ),
        )
    return {"id": request_id}

def require_admin(authorization: Optional[str]) -> None:
    """Owner-only: requires ADMIN_TOKEN env var as a Bearer token."""
    admin_token = os.environ.get("ADMIN_TOKEN")
    provided = (authorization or "").removeprefix("Bearer ").strip()
    if not admin_token or not secrets.compare_digest(provided, admin_token):
        raise HTTPException(status_code=404, detail="Not found")
@app.get("/api/template-requests")
def list_template_requests(authorization: Optional[str] = Header(default=None)):
    require_admin(authorization)
    with db() as conn:
        rows = conn.execute(
            "SELECT id, title, tools, description, status, created_at FROM template_requests "
            "ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]

class RequestStatusIn(BaseModel):
    status: str = Field(min_length=1, max_length=20)
@app.get("/api/admin/stats")
def admin_stats(authorization: Optional[str] = Header(default=None)):
    require_admin(authorization)
    with db() as conn:
        clients = conn.execute("SELECT COUNT(DISTINCT user_id) AS c FROM user_api_keys").fetchone()["c"]
        keys_issued = conn.execute("SELECT COUNT(*) AS c FROM user_api_keys").fetchone()["c"]
        templates_with_keys = conn.execute(
            "SELECT COUNT(DISTINCT template_id) AS c FROM user_api_keys"
        ).fetchone()["c"]
        requests_total = conn.execute("SELECT COUNT(*) AS c FROM template_requests").fetchone()["c"]
        requests_by_status = {
            r["status"]: r["c"]
            for r in conn.execute(
                "SELECT status, COUNT(*) AS c FROM template_requests GROUP BY status"
            ).fetchall()
        }
        runs_total = conn.execute("SELECT COUNT(*) AS c FROM runs").fetchone()["c"]
        runs_by_status = {
            r["status"]: r["c"]
            for r in conn.execute("SELECT status, COUNT(*) AS c FROM runs GROUP BY status").fetchall()
        }
        runs_by_template = {
            r["template_id"]: r["c"]
            for r in conn.execute(
                "SELECT template_id, COUNT(*) AS c FROM runs GROUP BY template_id ORDER BY c DESC LIMIT 10"
            ).fetchall()
        }
        recent_runs = [
            dict(r)
            for r in conn.execute(
                "SELECT id, template_id, client_id, status, created_at FROM runs "
                "ORDER BY created_at DESC LIMIT 10"
            ).fetchall()
        ]
    return {
        "clients": clients,
        "keysIssued": keys_issued,
        "templatesWithKeys": templates_with_keys,
        "requestsTotal": requests_total,
        "requestsByStatus": requests_by_status,
        "runsTotal": runs_total,
        "runsByStatus": runs_by_status,
        "runsByTemplate": runs_by_template,
        "recentRuns": recent_runs,
    }


@app.get("/api/admin/keys")
def admin_keys(authorization: Optional[str] = Header(default=None)):
    require_admin(authorization)
    with db() as conn:
        rows = conn.execute(
            "SELECT user_id, template_id, key_prefix, created_at FROM user_api_keys ORDER BY created_at DESC"
        ).fetchall()
    # Keys are stored hashed; only the display prefix is available for identification.
    return [
        {
            "clientId": r["user_id"],
            "templateId": r["template_id"],
            "keySuffix": r["key_prefix"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]


class RunIn(BaseModel):
    inputs: dict = Field(default_factory=dict)


@app.post("/api/v1/templates/{template_id}/run")
def run_template(
    template_id: str,
    body: Optional[RunIn] = None,
    authorization: Optional[str] = Header(default=None),
):
    template_id = check_template_id(template_id)
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer API key")
    key = authorization.split(" ", 1)[1].strip()
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM user_api_keys WHERE key_hash = %s", (hash_key(key),)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid API key")
        if row["template_id"] != template_id:
            raise HTTPException(
                status_code=403,
                detail="This key is bound to a different template",
            )
        run_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO runs (id, template_id, client_id, status, created_at) VALUES (%s, %s, %s, %s, %s)",
            (run_id, template_id, row["user_id"], "queued", now_iso()),
        )
    return {"ok": True, "runId": run_id, "templateId": template_id, "status": "queued"}


@app.get("/api/v1/templates/{template_id}/runs")
def list_runs(template_id: str, user_id: str = Depends(require_user)):
    """Returns only the calling user's runs for this template."""
    template_id = check_template_id(template_id)
    with db() as conn:
        rows = conn.execute(
            "SELECT id, template_id, status, created_at FROM runs "
            "WHERE template_id = %s AND client_id = %s ORDER BY created_at DESC LIMIT 50",
            (template_id, user_id),
        ).fetchall()
    return [dict(r) for r in rows]

def _proxy_host(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-host")
    first = (forwarded or "").split(",")[0].strip()
    return first or (request.headers.get("host") or "").strip()

@app.patch("/api/template-requests/{request_id}")
def update_template_request(
    request_id: str,
    body: RequestStatusIn,
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)
    if body.status not in REQUEST_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid status")
    with db() as conn:
        cur = conn.execute(
            "UPDATE template_requests SET status = %s WHERE id = %s", (body.status, request_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Request not found")
    return {"id": request_id, "status": body.status}

@app.api_route(
    CLERK_PROXY_PATH + "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def clerk_proxy(path: str, request: Request):
    if not IS_PRODUCTION or not CLERK_SECRET_KEY:
        raise HTTPException(status_code=404, detail="Not found")
    protocol = request.headers.get("x-forwarded-proto", "https")
    host = _proxy_host(request)
    proxy_url = f"{protocol}://{host}{CLERK_PROXY_PATH}"

    fwd_headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in _HOP_BY_HOP | {"host", "content-length"}
    }
    fwd_headers["Clerk-Proxy-Url"] = proxy_url
    fwd_headers["Clerk-Secret-Key"] = CLERK_SECRET_KEY
    xff = request.headers.get("x-forwarded-for", "")
    client_ip = xff.split(",")[0].strip() or (request.client.host if request.client else "")
    if client_ip:
        fwd_headers["X-Forwarded-For"] = client_ip

    body = await request.body()
    async with httpx.AsyncClient(timeout=30) as client:
        upstream = await client.request(
            request.method,
            f"{CLERK_FAPI}/{path}",
            params=request.query_params,
            headers=fwd_headers,
            content=body,
        )

    # Responses are fully buffered, so Content-Length is always set — the
    # deployment edge rejects chunked proxied responses.
    resp_headers = {
        k: v
        for k, v in upstream.headers.items()
        if k.lower() not in _HOP_BY_HOP | {"content-length", "content-encoding"}
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )
