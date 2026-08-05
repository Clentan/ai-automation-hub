import { useEffect, useSyncExternalStore } from 'react';

/** Key metadata as listed by the server. Plaintext is never stored server-side. */
export interface TemplateApiKey {
  templateId: string;
  keyPrefix: string;
  createdAt: string;
}

/** Returned only when a key is issued or regenerated — the plaintext is shown once. */
export interface IssuedTemplateApiKey extends TemplateApiKey {
  key: string;
}

const API_BASE = `${import.meta.env.BASE_URL}api`;

const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' };

interface KeysState {
  keys: TemplateApiKey[];
  loading: boolean;
  error: string | null;
  /** True when the server rejected the session (user must sign in). */
  unauthorized: boolean;
}

let state: KeysState = { keys: [], loading: true, error: null, unauthorized: false };
const listeners = new Set<() => void>();

function setState(next: Partial<KeysState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const serverState: KeysState = { keys: [], loading: true, error: null, unauthorized: false };
const getServerSnapshot = () => serverState;

let loaded = false;
// Version counter guards against a slow initial fetch overwriting newer mutations.
let mutationVersion = 0;

export async function refreshKeys(): Promise<void> {
  const versionAtStart = mutationVersion;
  try {
    const res = await fetch(`${API_BASE}/keys`, { credentials: 'same-origin' });
    if (res.status === 401) {
      if (versionAtStart !== mutationVersion) return;
      setState({ keys: [], loading: false, error: null, unauthorized: true });
      return;
    }
    if (!res.ok) throw new Error(`Failed to load keys (${res.status})`);
    const keys: TemplateApiKey[] = await res.json();
    if (versionAtStart !== mutationVersion) return; // a mutation happened meanwhile; its state wins
    setState({ keys, loading: false, error: null, unauthorized: false });
  } catch (e) {
    if (versionAtStart !== mutationVersion) return;
    setState({ loading: false, error: e instanceof Error ? e.message : 'Failed to load keys' });
  }
}

/** Call after sign-in/sign-out so the store reflects the new session. */
export function resetKeysStore(): void {
  mutationVersion++;
  setState({ keys: [], loading: true, error: null, unauthorized: false });
  refreshKeys();
}

async function parseIssueError(res: Response, fallback: string): Promise<never> {
  let detail = fallback;
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') detail = data.detail;
  } catch {
    // keep fallback
  }
  throw new Error(detail);
}

export async function requestKeyFor(templateId: string): Promise<IssuedTemplateApiKey> {
  const res = await fetch(`${API_BASE}/keys`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'same-origin',
    body: JSON.stringify({ templateId }),
  });
  if (!res.ok) await parseIssueError(res, 'Failed to issue API key');
  const entry: IssuedTemplateApiKey = await res.json();
  mutationVersion++;
  setState({
    keys: [
      { templateId: entry.templateId, keyPrefix: entry.keyPrefix, createdAt: entry.createdAt },
      ...state.keys.filter((k) => k.templateId !== templateId),
    ],
    loading: false,
    error: null,
    unauthorized: false,
  });
  return entry;
}

export async function regenerateKeyFor(templateId: string): Promise<IssuedTemplateApiKey> {
  const res = await fetch(`${API_BASE}/keys/${encodeURIComponent(templateId)}/regenerate`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!res.ok) await parseIssueError(res, 'Failed to regenerate API key');
  const entry: IssuedTemplateApiKey = await res.json();
  mutationVersion++;
  setState({
    keys: state.keys.map((k) =>
      k.templateId === templateId
        ? { templateId: entry.templateId, keyPrefix: entry.keyPrefix, createdAt: entry.createdAt }
        : k,
    ),
    error: null,
  });
  return entry;
}

export async function revokeKeyFor(templateId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/keys/${encodeURIComponent(templateId)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to revoke API key');
  mutationVersion++;
  setState({ keys: state.keys.filter((k) => k.templateId !== templateId), error: null });
}

/** Revoke every key on this account (used by Settings "clear data"). */
export async function revokeAllKeys(): Promise<void> {
  const res = await fetch(`${API_BASE}/keys`, { credentials: 'same-origin' });
  if (res.ok) {
    const keys: TemplateApiKey[] = await res.json();
    await Promise.allSettled(keys.map((k) => revokeKeyFor(k.templateId)));
  }
}

export async function submitTemplateRequest(request: {
  title: string;
  tools: string;
  description: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/template-requests`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });
  if (res.status === 401) throw new Error('sign-in-required');
  if (!res.ok) throw new Error('Failed to submit template request');
}

export function useApiKeys() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!loaded) {
      loaded = true;
      refreshKeys();
    }
  }, []);

  return {
    keys: snapshot.keys,
    loading: snapshot.loading,
    error: snapshot.error,
    unauthorized: snapshot.unauthorized,
    getKeyFor: (templateId: string) => snapshot.keys.find((k) => k.templateId === templateId) ?? null,
    requestKeyFor,
    regenerateKeyFor,
    revokeKeyFor,
  };
}
