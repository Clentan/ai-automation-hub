// Thin client for the shared FastAPI backend at /api.
// Expo bundles run outside the workspace proxy, so absolute URLs are required.
// Auth uses a Clerk bearer token (no browser cookie jar on mobile).

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const API_BASE = domain ? `https://${domain}/api` : '/api';

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

export function setApiTokenGetter(fn: TokenGetter | null) {
  tokenGetter = fn;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = typeof body?.detail === 'string' ? body.detail : '';
    } catch {
      // ignore body parse failures
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface KeyMeta {
  templateId: string;
  keyPrefix: string;
  createdAt: string;
}

export interface KeyIssued extends KeyMeta {
  key: string;
}

export interface Run {
  id: string;
  template_id: string;
  status: string;
  created_at: string;
}

export function getKeys(): Promise<KeyMeta[]> {
  return apiFetch<KeyMeta[]>('/keys');
}

export function issueKey(templateId: string): Promise<KeyIssued> {
  return apiFetch<KeyIssued>('/keys', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
}

export function regenerateKey(templateId: string): Promise<KeyIssued> {
  return apiFetch<KeyIssued>(`/keys/${templateId}/regenerate`, { method: 'POST' });
}

export function revokeKey(templateId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/keys/${templateId}`, { method: 'DELETE' });
}

export function getRuns(templateId: string): Promise<Run[]> {
  return apiFetch<Run[]>(`/v1/templates/${templateId}/runs`);
}

export async function getAllRuns(): Promise<Run[]> {
  const keys = await getKeys();
  const runLists = await Promise.all(
    keys.map((k) => getRuns(k.templateId).catch(() => [] as Run[])),
  );
  return runLists
    .flat()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
