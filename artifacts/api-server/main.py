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
import json
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

# Prefer the Supabase Postgres database when a valid connection string is
# configured; fall back to the built-in Replit database otherwise.
_supabase_url = (os.environ.get("SUPABASE_DB_URL") or "").strip()
if _supabase_url and not _supabase_url.startswith(("postgresql://", "postgres://")):
    print("WARNING: SUPABASE_DB_URL is not a postgresql:// connection string; ignoring it.")
    _supabase_url = ""
DATABASE_URL = _supabase_url or os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("SUPABASE_DB_URL or DATABASE_URL environment variable is required")

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=10, kwargs={"row_factory": dict_row})

app = FastAPI(title="AI Automation Hub API", docs_url="/api/docs", openapi_url="/api/openapi.json")

# The frontend is served same-origin through the workspace proxy, so no
# cross-origin access is required or allowed.

# Per-template n8n webhook targets. The URLs stay server-side only — API
# callers never see them; the run endpoint proxies to them ("masking").
def _webhook_url_from_env() -> str:
    """Prefer the plain env var override; fall back to the secret.

    N8N_WEBHOOK_URL_OVERRIDE exists because the secret UI sometimes retains a
    stale value; the override is a non-secret env var we can manage directly.
    """
    return (
        os.environ.get("N8N_WEBHOOK_URL_OVERRIDE", "").strip()
        or os.environ.get("N8N_WEBHOOK_URL", "").strip()
    )


N8N_WEBHOOK_URL = _webhook_url_from_env()

# Templates whose webhook URL comes from the environment when no explicit
# webhook_url is stored in the DB row (legacy behavior for QCR Scan).
ENV_WEBHOOK_TEMPLATE_IDS = {"t-21"}


def template_webhook_url(template_id: str) -> str:
    """Resolve the n8n webhook target for a template.

    Prefers the webhook_url stored on the template row; falls back to the
    N8N_WEBHOOK_URL env/secret for legacy env-configured templates.
    """
    with db() as conn:
        row = conn.execute(
            "SELECT webhook_url FROM templates WHERE id = %s", (template_id,)
        ).fetchone()
    url = ((row or {}).get("webhook_url") or "").strip()
    if not url and template_id in ENV_WEBHOOK_TEMPLATE_IDS:
        url = _webhook_url_from_env()
    return url

# Weekly digest constants
DIGEST_PERIOD_SECONDS = 7 * 24 * 3600
DIGEST_CHECK_SECONDS = 3600


@contextmanager
def db():
    with pool.connection() as conn:
        yield conn


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id             TEXT PRIMARY KEY,
                email_notifications BOOLEAN NOT NULL,
                updated_at          TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS digest_log (
                user_id      TEXT PRIMARY KEY,
                last_sent_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS templates (
                id            TEXT PRIMARY KEY,
                name          TEXT NOT NULL,
                description   TEXT NOT NULL DEFAULT '',
                author        TEXT NOT NULL DEFAULT 'AI Automation Hub',
                type          TEXT NOT NULL DEFAULT 'Automated',
                categories    JSONB NOT NULL DEFAULT '[]',
                usage_count   INTEGER NOT NULL DEFAULT 0,
                services      JSONB NOT NULL DEFAULT '[]',
                steps         JSONB NOT NULL DEFAULT '[]',
                created_at    TEXT NOT NULL,
                available     BOOLEAN NOT NULL DEFAULT FALSE,
                documentation TEXT NOT NULL DEFAULT '',
                webhook_url   TEXT NOT NULL DEFAULT ''
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
        _seed_templates(conn)


def _seed_templates(conn) -> None:
    """One-time seed of the templates table from the shipped catalog."""
    count = conn.execute("SELECT COUNT(*) AS c FROM templates").fetchone()["c"]
    if count:
        return
    seed_path = os.path.join(os.path.dirname(__file__), "templates_seed.json")
    try:
        with open(seed_path, encoding="utf-8") as f:
            seed = json.load(f)
    except FileNotFoundError:
        print("WARNING: templates_seed.json not found; templates table left empty.")
        return
    for t in seed:
        conn.execute(
            "INSERT INTO templates (id, name, description, author, type, categories, "
            "usage_count, services, steps, created_at, available, documentation, webhook_url) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (id) DO NOTHING",
            (
                t["id"],
                t["name"],
                t.get("description", ""),
                t.get("author", "AI Automation Hub"),
                t.get("type", "Automated"),
                json.dumps(t.get("categories", [])),
                t.get("usageCount", 0),
                json.dumps(t.get("services", [])),
                json.dumps(t.get("steps", [])),
                t.get("createdAt") or now_iso(),
                bool(t.get("available")),
                t.get("documentation", ""),
                "",
            ),
        )
    print(f"[templates] seeded {len(seed)} templates")


init_db()

REQUEST_STATUSES = {"new", "reviewed", "planned", "done"}

TEMPLATE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


# --------------------------------------------------------------------------
# Clerk configuration
# --------------------------------------------------------------------------

# The owner's own Clerk application takes priority over the Replit-managed one.
CLERK_SECRET_KEY = os.environ.get("OWN_CLERK_SECRET_KEY") or os.environ.get("CLERK_SECRET_KEY", "")
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
    if not TEMPLATE_ID_RE.match(template_id):
        raise HTTPException(status_code=404, detail="Unknown template id")
    with db() as conn:
        row = conn.execute("SELECT id FROM templates WHERE id = %s", (template_id,)).fetchone()
    if not row:
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


# --------------------------------------------------------------------------
# Template catalog (DB-backed)
# --------------------------------------------------------------------------

TEMPLATE_TYPES = {"Automated", "Scheduled", "Instant"}


class TemplateStep(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)
    serviceId: str = Field(default="", max_length=64)


class TemplateIn(BaseModel):
    id: Optional[str] = Field(default=None, min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    author: str = Field(default="AI Automation Hub", max_length=100)
    type: str = Field(default="Automated", max_length=20)
    categories: list[str] = Field(default_factory=list)
    usageCount: int = Field(default=0, ge=0)
    services: list[str] = Field(default_factory=list)
    steps: list[TemplateStep] = Field(default_factory=list)
    available: bool = False
    documentation: str = Field(default="", max_length=10000)
    webhookUrl: str = Field(default="", max_length=500)


class TemplatePatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    author: Optional[str] = Field(default=None, max_length=100)
    type: Optional[str] = Field(default=None, max_length=20)
    categories: Optional[list[str]] = None
    usageCount: Optional[int] = Field(default=None, ge=0)
    services: Optional[list[str]] = None
    steps: Optional[list[TemplateStep]] = None
    available: Optional[bool] = None
    documentation: Optional[str] = Field(default=None, max_length=10000)
    webhookUrl: Optional[str] = Field(default=None, max_length=500)


def _template_public(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "author": row["author"],
        "type": row["type"],
        "categories": row["categories"],
        "usageCount": row["usage_count"],
        "services": row["services"],
        "steps": row["steps"],
        "createdAt": row["created_at"],
        "available": row["available"],
        "documentation": row["documentation"],
    }


@app.get("/api/templates")
def list_templates():
    """Public template catalog (webhook URLs stay server-side)."""
    with db() as conn:
        rows = conn.execute("SELECT * FROM templates ORDER BY created_at DESC").fetchall()
    return [_template_public(r) for r in rows]


@app.get("/api/admin/templates")
def admin_list_templates(request: Request):
    require_admin(request)
    with db() as conn:
        rows = conn.execute("SELECT * FROM templates ORDER BY created_at DESC").fetchall()
    return [{**_template_public(r), "webhookUrl": r["webhook_url"]} for r in rows]


def _validate_template_fields(type_: Optional[str], template_id: Optional[str] = None) -> None:
    if type_ is not None and type_ not in TEMPLATE_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {sorted(TEMPLATE_TYPES)}")
    if template_id is not None and not TEMPLATE_ID_RE.match(template_id):
        raise HTTPException(status_code=422, detail="id may only contain letters, digits, - and _")


@app.post("/api/admin/templates", status_code=201)
def admin_create_template(body: TemplateIn, request: Request):
    require_admin(request)
    template_id = (body.id or "").strip() or f"t-{uuid.uuid4().hex[:8]}"
    _validate_template_fields(body.type, template_id)
    created = now_iso()
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO templates (id, name, description, author, type, categories, "
            "usage_count, services, steps, created_at, available, documentation, webhook_url) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (id) DO NOTHING",
            (
                template_id,
                body.name.strip(),
                body.description.strip(),
                body.author.strip() or "AI Automation Hub",
                body.type,
                json.dumps(body.categories),
                body.usageCount,
                json.dumps(body.services),
                json.dumps([s.model_dump() for s in body.steps]),
                created,
                body.available,
                body.documentation,
                body.webhookUrl.strip(),
            ),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=409, detail="A template with this id already exists")
        row = conn.execute("SELECT * FROM templates WHERE id = %s", (template_id,)).fetchone()
    return {**_template_public(row), "webhookUrl": row["webhook_url"]}


@app.patch("/api/admin/templates/{template_id}")
def admin_update_template(template_id: str, body: TemplatePatch, request: Request):
    require_admin(request)
    _validate_template_fields(body.type)
    updates: dict[str, object] = {}
    if body.name is not None:
        updates["name"] = body.name.strip()
    if body.description is not None:
        updates["description"] = body.description.strip()
    if body.author is not None:
        updates["author"] = body.author.strip() or "AI Automation Hub"
    if body.type is not None:
        updates["type"] = body.type
    if body.categories is not None:
        updates["categories"] = json.dumps(body.categories)
    if body.usageCount is not None:
        updates["usage_count"] = body.usageCount
    if body.services is not None:
        updates["services"] = json.dumps(body.services)
    if body.steps is not None:
        updates["steps"] = json.dumps([s.model_dump() for s in body.steps])
    if body.available is not None:
        updates["available"] = body.available
    if body.documentation is not None:
        updates["documentation"] = body.documentation
    if body.webhookUrl is not None:
        updates["webhook_url"] = body.webhookUrl.strip()
    if not updates:
        raise HTTPException(status_code=422, detail="No fields to update")
    set_clause = ", ".join(f"{col} = %s" for col in updates)
    with db() as conn:
        cur = conn.execute(
            f"UPDATE templates SET {set_clause} WHERE id = %s",
            (*updates.values(), template_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        row = conn.execute("SELECT * FROM templates WHERE id = %s", (template_id,)).fetchone()
    return {**_template_public(row), "webhookUrl": row["webhook_url"]}

class SettingsOut(BaseModel):
    emailNotifications: bool


class SettingsIn(BaseModel):
    emailNotifications: bool


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

_user_email_cache: dict[str, tuple[str, float]] = {}
USER_EMAIL_TTL = 300.0


def _get_user_email(user_id: str) -> Optional[str]:
    """Fetch (and cache) a Clerk user's primary email address."""
    cached = _user_email_cache.get(user_id)
    if cached and time.monotonic() - cached[1] < USER_EMAIL_TTL:
        return cached[0]
    if not CLERK_SECRET_KEY:
        return None
    try:
        resp = httpx.get(
            f"{CLERK_API}/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None
    email = None
    primary_id = data.get("primary_email_address_id")
    for addr in data.get("email_addresses", []):
        if addr.get("id") == primary_id or email is None:
            email = addr.get("email_address")
        if addr.get("id") == primary_id:
            break
    if email:
        _user_email_cache[user_id] = (email.lower(), time.monotonic())
        return email.lower()
    return None


def _admin_emails() -> set[str]:
    raw = os.environ.get("ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def require_admin(request: Request) -> None:
    """Owner-only access.

    Grants access when either:
    - the signed-in Clerk user's email is listed in ADMIN_EMAILS, or
    - a valid ADMIN_TOKEN is supplied as a Bearer token (legacy/API access).
    """
    # Temporary kill switch: set ADMIN_DISABLED=1 to hide all admin access
    # (useful for previewing the app as a regular user).
    if os.environ.get("ADMIN_DISABLED"):
        raise HTTPException(status_code=404, detail="Not found")
    authorization = request.headers.get("authorization")
    admin_token = os.environ.get("ADMIN_TOKEN")
    provided = (authorization or "").removeprefix("Bearer ").strip()
    if admin_token and provided and secrets.compare_digest(provided, admin_token):
        return
    # Fall back to the signed-in user's email.
    try:
        user_id = require_user(request)
    except HTTPException:
        raise HTTPException(status_code=404, detail="Not found")
    email = _get_user_email(user_id)
    if not email or email not in _admin_emails():
        raise HTTPException(status_code=404, detail="Not found")
@app.get("/api/template-requests")
def list_template_requests(request: Request):
    require_admin(request)
    with db() as conn:
        rows = conn.execute(
            "SELECT id, title, tools, description, status, created_at FROM template_requests "
            "ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]

class RequestStatusIn(BaseModel):
    status: str = Field(min_length=1, max_length=20)
def _clerk_user_count() -> int | None:
    """Total signed-up accounts, from Clerk. None if unavailable."""
    if not CLERK_SECRET_KEY:
        return None
    try:
        resp = httpx.get(
            f"{CLERK_API}/v1/users/count",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=5,
        )
        if resp.status_code == 200:
            return resp.json().get("total_count")
    except Exception:
        pass
    return None


@app.get("/api/admin/stats")
def admin_stats(request: Request):
    require_admin(request)
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
    registered_users = _clerk_user_count()
    return {
        "registeredUsers": registered_users,
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


@app.get("/api/admin/users")
def admin_users(request: Request):
    """Signed-up accounts (from Clerk) merged with each user's keys and run counts."""
    require_admin(request)
    clerk_users = []
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=503, detail="User directory unavailable (Clerk not configured)")
    try:
        offset = 0
        while True:
            resp = httpx.get(
                f"{CLERK_API}/v1/users?limit=100&offset={offset}&order_by=-created_at",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
                timeout=10,
            )
            resp.raise_for_status()
            page = resp.json()
            clerk_users.extend(page)
            if len(page) < 100 or len(clerk_users) >= 10000:
                break
            offset += 100
    except (httpx.HTTPError, ValueError):
        # Don't present a partial/empty list as truth — surface the failure.
        raise HTTPException(status_code=502, detail="Could not load users from the sign-in service. Try again shortly.")

    with db() as conn:
        key_rows = conn.execute(
            "SELECT user_id, template_id, key_prefix, created_at FROM user_api_keys ORDER BY created_at DESC"
        ).fetchall()
        run_counts = {
            r["client_id"]: r["c"]
            for r in conn.execute("SELECT client_id, COUNT(*) AS c FROM runs GROUP BY client_id").fetchall()
        }

    keys_by_user: dict = {}
    for r in key_rows:
        keys_by_user.setdefault(r["user_id"], []).append(
            {"templateId": r["template_id"], "keyPrefix": r["key_prefix"], "createdAt": r["created_at"]}
        )

    users = []
    seen = set()
    for u in clerk_users:
        uid = u.get("id")
        seen.add(uid)
        emails = {e["id"]: e.get("email_address") for e in u.get("email_addresses", [])}
        users.append({
            "id": uid,
            "email": emails.get(u.get("primary_email_address_id")) or next(iter(emails.values()), None),
            "name": " ".join(p for p in [u.get("first_name"), u.get("last_name")] if p) or None,
            "createdAt": u.get("created_at"),
            "lastSignInAt": u.get("last_sign_in_at"),
            "keys": keys_by_user.get(uid, []),
            "runsTotal": run_counts.get(uid, 0),
        })
    # Users with keys/runs that no longer exist in Clerk (deleted accounts).
    for uid, keys in keys_by_user.items():
        if uid not in seen:
            users.append({
                "id": uid, "email": None, "name": None, "createdAt": None,
                "lastSignInAt": None, "keys": keys, "runsTotal": run_counts.get(uid, 0),
            })
    return users


@app.delete("/api/admin/users/{user_id}/keys/{template_id}")
def admin_revoke_key(user_id: str, template_id: str, request: Request):
    """Owner revokes a user's key for one template."""
    require_admin(request)
    with db() as conn:
        cur = conn.execute(
            "DELETE FROM user_api_keys WHERE user_id = %s AND template_id = %s",
            (user_id, template_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Key not found")
    return {"ok": True}


@app.get("/api/admin/keys")
def admin_keys(request: Request):
    require_admin(request)
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


# --------------------------------------------------------------------------
# Rate limiting (in-memory sliding window)
# --------------------------------------------------------------------------

import threading
from collections import defaultdict, deque

# Per-key: successful run requests.
RUN_LIMIT_PER_KEY = 60  # per minute
# Per-IP: invalid-key (401) attempts — makes key guessing infeasible.
INVALID_LIMIT_PER_IP = 10  # per minute
RATE_WINDOW = 60.0  # seconds

_rate_lock = threading.Lock()
_rate_buckets: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    """Client IP for rate limiting, spoof-resistant.

    X-Forwarded-For is client-controllable except for the entry appended by
    the trusted platform proxy immediately in front of this server. Using the
    RIGHTMOST entry (appended last, by the proxy we trust) means a caller
    cannot rotate buckets by sending fake leftmost values. If the header is
    absent (direct connection), fall back to the socket peer address.
    """
    xff = request.headers.get("x-forwarded-for", "")
    parts = [p.strip() for p in xff.split(",") if p.strip()]
    if parts:
        return parts[-1]
    return request.client.host if request.client else "unknown"


def _rate_check(bucket: str, limit: int) -> Optional[int]:
    """Returns None if allowed (and records the hit), else seconds to retry after."""
    now = time.monotonic()
    with _rate_lock:
        q = _rate_buckets[bucket]
        while q and now - q[0] > RATE_WINDOW:
            q.popleft()
        if len(q) >= limit:
            return max(1, int(RATE_WINDOW - (now - q[0])) + 1)
        q.append(now)
        # Opportunistic cleanup of stale buckets to bound memory.
        if len(_rate_buckets) > 10000:
            for k in [k for k, v in _rate_buckets.items() if not v or now - v[-1] > RATE_WINDOW]:
                _rate_buckets.pop(k, None)
        return None


def _rate_limit_or_429(bucket: str, limit: int) -> None:
    retry_after = _rate_check(bucket, limit)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )


@app.post("/api/v1/templates/{template_id}/run")
async def run_template(
    template_id: str,
    request: Request,
    authorization: Optional[str] = Header(default=None),
):
    template_id = check_template_id(template_id)
    ip = _client_ip(request)
    if not authorization or not authorization.lower().startswith("bearer "):
        _rate_limit_or_429(f"ip401:{ip}", INVALID_LIMIT_PER_IP)
        raise HTTPException(status_code=401, detail="Missing Bearer API key")
    key = authorization.split(" ", 1)[1].strip()
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM user_api_keys WHERE key_hash = %s", (hash_key(key),)
        ).fetchone()
        if not row:
            # Throttle invalid-key attempts per IP to make brute forcing infeasible.
            _rate_limit_or_429(f"ip401:{ip}", INVALID_LIMIT_PER_IP)
            raise HTTPException(status_code=401, detail="Invalid API key")
        if row["template_id"] != template_id:
            raise HTTPException(
                status_code=403,
                detail="This key is bound to a different template",
            )
        # Per-key limit on successful (authorized) runs only.
        _rate_limit_or_429(f"key:{row['key_hash']}", RUN_LIMIT_PER_KEY)
        run_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO runs (id, template_id, client_id, status, created_at) VALUES (%s, %s, %s, %s, %s)",
            (run_id, template_id, row["user_id"], "queued", now_iso()),
        )

    return await _forward_run(template_id, run_id, request)


async def _forward_run(template_id: str, run_id: str, request: Request) -> dict:
    """Proxies the caller's payload to the template's n8n webhook.

    Masks the webhook URL behind this API; content is passed through as-is
    (JSON or multipart). Updates the run row with the final status.
    """
    webhook_url = template_webhook_url(template_id)
    if not webhook_url:
        return {"ok": True, "runId": run_id, "templateId": template_id, "status": "queued"}

    raw = await request.body()
    fwd_headers = {}
    content_type = request.headers.get("content-type")
    if content_type:
        fwd_headers["Content-Type"] = content_type
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(webhook_url, content=raw, headers=fwd_headers)
        succeeded = resp.status_code < 400
        try:
            result = resp.json()
        except ValueError:
            result = resp.text
        # n8n workflows may report failures in the body with HTTP 200
        # (e.g. {"status": "error", "message": ...}) — treat those as failed.
        if succeeded and isinstance(result, dict) and result.get("status") == "error":
            succeeded = False
    except httpx.HTTPError:
        with db() as conn:
            conn.execute("UPDATE runs SET status = %s WHERE id = %s", ("failed", run_id))
        raise HTTPException(status_code=502, detail="The automation backend is unreachable. Try again shortly.")

    status = "succeeded" if succeeded else "failed"
    with db() as conn:
        conn.execute("UPDATE runs SET status = %s WHERE id = %s", (status, run_id))
    if not succeeded:
        detail = "The automation failed to process this request."
        if isinstance(result, dict) and isinstance(result.get("message"), str):
            detail = result["message"]
        raise HTTPException(status_code=422, detail=detail)
    return {"ok": True, "runId": run_id, "templateId": template_id, "status": status, "result": result}


@app.post("/api/templates/{template_id}/run")
async def run_template_web(
    template_id: str,
    request: Request,
    user_id: str = Depends(require_user),
):
    """In-app runner: signed-in users run a template from the website
    (no API key needed). Same proxy, logging, and rate limits as the
    key-based endpoint, but throttled per account instead of per key."""
    template_id = check_template_id(template_id)
    _rate_limit_or_429(f"webrun:{user_id}", RUN_LIMIT_PER_KEY)
    run_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute(
            "INSERT INTO runs (id, template_id, client_id, status, created_at) VALUES (%s, %s, %s, %s, %s)",
            (run_id, template_id, user_id, "queued", now_iso()),
        )
    return await _forward_run(template_id, run_id, request)


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
    request: Request,
):
    require_admin(request)
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

@app.get("/api/settings", response_model=SettingsOut)
def get_settings(user_id: str = Depends(require_user)):
    with db() as conn:
        row = conn.execute(
            "SELECT email_notifications FROM user_settings WHERE user_id = %s", (user_id,)
        ).fetchone()
    # Email digests are opt-in: users without a stored preference are off.
    return SettingsOut(emailNotifications=bool(row["email_notifications"]) if row else False)


def _digest_loop() -> None:
    # Fire once immediately so opted-in users are not made to wait up to an
    # hour after a fresh deploy, then repeat on the hourly cadence.
    try:
        summary = run_digest_once()
        if summary["due"]:
            print(f"[digest] startup sweep: {summary}", flush=True)
    except Exception as e:  # noqa: BLE001
        print(f"[digest] startup sweep failed: {e}", flush=True)
    while True:
        time.sleep(DIGEST_CHECK_SECONDS)
        try:
            summary = run_digest_once()
            if summary["due"]:
                print(f"[digest] {summary}", flush=True)
        except Exception as e:  # noqa: BLE001
            print(f"[digest] sweep failed: {e}", flush=True)

def run_digest_once() -> dict:
    """Sends the weekly digest to every opted-in user who is due. Returns a summary."""
    cutoff_sent = time.strftime(
        "%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - DIGEST_PERIOD_SECONDS)
    )
    week_ago = cutoff_sent
    with db() as conn:
        due = conn.execute(
            "SELECT s.user_id FROM user_settings s "
            "LEFT JOIN digest_log d ON d.user_id = s.user_id "
            "WHERE s.email_notifications AND (d.last_sent_at IS NULL OR d.last_sent_at < %s)",
            (cutoff_sent,),
        ).fetchall()
    summary = {"due": len(due), "sent": 0, "skippedNoRuns": 0, "errors": []}
    for row in due:
        user_id = row["user_id"]
        try:
            with db() as conn:
                runs = conn.execute(
                    "SELECT template_id, status FROM runs WHERE client_id = %s AND created_at >= %s",
                    (user_id, week_ago),
                ).fetchall()
            if not runs:
                # No runs this week — leave digest_log untouched so the user
                # is checked again next sweep and gets a digest as soon as they
                # have run data worth reporting.
                summary["skippedNoRuns"] += 1
                continue
            email = _get_user_email(user_id)
            if not email:
                raise RuntimeError("no email address on account")
            send_email(email, "Your weekly automation digest", _digest_html([dict(r) for r in runs]))
            with db() as conn:
                conn.execute(
                    "INSERT INTO digest_log (user_id, last_sent_at) VALUES (%s, %s) "
                    "ON CONFLICT (user_id) DO UPDATE SET last_sent_at = EXCLUDED.last_sent_at",
                    (user_id, now_iso()),
                )
            summary["sent"] += 1
        except Exception as e:  # noqa: BLE001 — keep going for other users, but report loudly.
            print(f"[digest] failed for {user_id}: {e}", flush=True)
            summary["errors"].append(f"{user_id}: {e}")
    return summary

@app.post("/api/admin/digest/run")
def admin_run_digest(request: Request):
    """Owner-only: trigger a digest sweep immediately (for testing/ops)."""
    require_admin(request)
    return run_digest_once()

@app.put("/api/settings", response_model=SettingsOut)
def put_settings(body: SettingsIn, user_id: str = Depends(require_user)):
    with db() as conn:
        conn.execute(
            "INSERT INTO user_settings (user_id, email_notifications, updated_at) "
            "VALUES (%s, %s, %s) "
            "ON CONFLICT (user_id) DO UPDATE SET email_notifications = EXCLUDED.email_notifications, "
            "updated_at = EXCLUDED.updated_at",
            (user_id, body.emailNotifications, now_iso()),
        )
    return SettingsOut(emailNotifications=body.emailNotifications)

@app.on_event("startup")
def _start_digest_thread() -> None:
    import threading

    threading.Thread(target=_digest_loop, name="weekly-digest", daemon=True).start()


def _digest_html(runs: list[dict]) -> str:
    total = len(runs)
    by_status: dict[str, int] = {}
    by_template: dict[str, int] = {}
    for r in runs:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
        by_template[r["template_id"]] = by_template.get(r["template_id"], 0) + 1
    status_rows = "".join(
        f"<li>{count} {status}</li>" for status, count in sorted(by_status.items())
    )
    template_rows = "".join(
        f"<li><code>{tpl}</code>: {count} run{'s' if count != 1 else ''}</li>"
        for tpl, count in sorted(by_template.items(), key=lambda kv: -kv[1])
    )
    return (
        "<h2>Your weekly automation digest</h2>"
        f"<p>You had <strong>{total}</strong> automation run{'s' if total != 1 else ''} in the last 7 days.</p>"
        f"<h3>By status</h3><ul>{status_rows}</ul>"
        f"<h3>By template</h3><ul>{template_rows}</ul>"
        "<p style=\"color:#666;font-size:12px\">You're receiving this because Email Notifications "
        "is turned on in your AI Automation Hub settings. Turn it off there to stop these digests.</p>"
    )

def send_email(to_addr: str, subject: str, html_body: str) -> None:
    """Sends an email by POSTing to the n8n webhook.

    The n8n workflow is expected to read `to`, `subject`, and `html` from the
    JSON body and deliver the message via whichever email node is configured
    there (SMTP, SendGrid, Gmail, etc.).

    N8N_WEBHOOK_URL is read at call time (not cached at import) so that the
    secret is always current in every runtime environment.
    """
    webhook_url = _webhook_url_from_env()
    if not webhook_url:
        raise RuntimeError("N8N_WEBHOOK_URL is not configured — cannot send email")
    resp = httpx.post(
        webhook_url,
        json={"to": to_addr, "subject": subject, "html": html_body},
        timeout=30,
    )
    resp.raise_for_status()
