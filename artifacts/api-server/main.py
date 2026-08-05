"""AI Automation Hub - FastAPI backend.

Serves under the /api path prefix (routed by the workspace proxy).
Stores per-client template API keys, template requests, and run logs in
PostgreSQL (DATABASE_URL) so data survives redeploys.
"""
import os
import re
import secrets
import time
import uuid
from contextlib import contextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
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
            CREATE TABLE IF NOT EXISTS api_keys (
                client_id   TEXT NOT NULL,
                template_id TEXT NOT NULL,
                key         TEXT NOT NULL UNIQUE,
                created_at  TEXT NOT NULL,
                PRIMARY KEY (client_id, template_id)
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


init_db()

CLIENT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
TEMPLATE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def require_client(client_id: Optional[str]) -> str:
    if not client_id or not CLIENT_ID_RE.match(client_id):
        raise HTTPException(status_code=400, detail="Missing or invalid X-Client-Id header")
    return client_id


def check_template_id(template_id: str) -> str:
    if not TEMPLATE_ID_RE.match(template_id) or template_id not in KNOWN_TEMPLATE_IDS:
        raise HTTPException(status_code=404, detail="Unknown template id")
    return template_id


def new_key() -> str:
    return f"aah_tpl_{secrets.token_hex(16)}"


class KeyOut(BaseModel):
    templateId: str
    key: str
    createdAt: str


class IssueKeyIn(BaseModel):
    templateId: str = Field(min_length=1, max_length=64)


class TemplateRequestIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    tools: str = Field(default="", max_length=300)
    description: str = Field(min_length=1, max_length=3000)


def row_to_key(row: dict) -> KeyOut:
    return KeyOut(templateId=row["template_id"], key=row["key"], createdAt=row["created_at"])


@app.get("/api/healthz")
def healthz():
    return {"ok": True}


@app.get("/api/keys", response_model=list[KeyOut])
def list_keys(x_client_id: Optional[str] = Header(default=None)):
    client_id = require_client(x_client_id)
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM api_keys WHERE client_id = %s ORDER BY created_at DESC", (client_id,)
        ).fetchall()
    return [row_to_key(r) for r in rows]


@app.post("/api/keys", response_model=KeyOut)
def issue_key(body: IssueKeyIn, x_client_id: Optional[str] = Header(default=None)):
    client_id = require_client(x_client_id)
    template_id = check_template_id(body.templateId)
    with db() as conn:
        created = now_iso()
        key = new_key()
        # Atomic: concurrent requests for the same (client, template) keep the first key.
        conn.execute(
            "INSERT INTO api_keys (client_id, template_id, key, created_at) VALUES (%s, %s, %s, %s) "
            "ON CONFLICT (client_id, template_id) DO NOTHING",
            (client_id, template_id, key, created),
        )
        row = conn.execute(
            "SELECT * FROM api_keys WHERE client_id = %s AND template_id = %s",
            (client_id, template_id),
        ).fetchone()
    return row_to_key(row)


@app.post("/api/keys/{template_id}/regenerate", response_model=KeyOut)
def regenerate_key(template_id: str, x_client_id: Optional[str] = Header(default=None)):
    client_id = require_client(x_client_id)
    template_id = check_template_id(template_id)
    with db() as conn:
        created = now_iso()
        key = new_key()
        row = conn.execute(
            "UPDATE api_keys SET key = %s, created_at = %s "
            "WHERE client_id = %s AND template_id = %s RETURNING *",
            (key, created, client_id, template_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No key for this template")
    return KeyOut(templateId=template_id, key=key, createdAt=created)


@app.delete("/api/keys/{template_id}", status_code=204)
def revoke_key(template_id: str, x_client_id: Optional[str] = Header(default=None)):
    client_id = require_client(x_client_id)
    template_id = check_template_id(template_id)
    with db() as conn:
        conn.execute(
            "DELETE FROM api_keys WHERE client_id = %s AND template_id = %s",
            (client_id, template_id),
        )
    return None


@app.post("/api/template-requests", status_code=201)
def create_template_request(body: TemplateRequestIn, x_client_id: Optional[str] = Header(default=None)):
    request_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute(
            "INSERT INTO template_requests (id, client_id, title, tools, description, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (
                request_id,
                x_client_id if x_client_id and CLIENT_ID_RE.match(x_client_id) else None,
                body.title.strip(),
                body.tools.strip(),
                body.description.strip(),
                now_iso(),
            ),
        )
    return {"id": request_id}


@app.get("/api/template-requests")
def list_template_requests(authorization: Optional[str] = Header(default=None)):
    """Owner-only: requires ADMIN_TOKEN env var as a Bearer token."""
    admin_token = os.environ.get("ADMIN_TOKEN")
    provided = (authorization or "").removeprefix("Bearer ").strip()
    if not admin_token or not secrets.compare_digest(provided, admin_token):
        raise HTTPException(status_code=404, detail="Not found")
    with db() as conn:
        rows = conn.execute(
            "SELECT id, title, tools, description, created_at FROM template_requests ORDER BY created_at DESC"
        ).fetchall()
    return rows


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
        row = conn.execute("SELECT * FROM api_keys WHERE key = %s", (key,)).fetchone()
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
            (run_id, template_id, row["client_id"], "queued", now_iso()),
        )
    return {"ok": True, "runId": run_id, "templateId": template_id, "status": "queued"}


@app.get("/api/v1/templates/{template_id}/runs")
def list_runs(template_id: str, x_client_id: Optional[str] = Header(default=None)):
    """Returns only the calling client's runs for this template."""
    client_id = require_client(x_client_id)
    template_id = check_template_id(template_id)
    with db() as conn:
        rows = conn.execute(
            "SELECT id, template_id, status, created_at FROM runs "
            "WHERE template_id = %s AND client_id = %s ORDER BY created_at DESC LIMIT 50",
            (template_id, client_id),
        ).fetchall()
    return rows
