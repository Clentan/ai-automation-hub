import { useEffect, useSyncExternalStore } from 'react';

export interface TemplateApiKey {
  templateId: string;
  key: string;
  createdAt: string;
}

const CLIENT_ID_STORAGE = 'ai-automation-hub-client-id';
const API_BASE = `${import.meta.env.BASE_URL}api`;

export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_STORAGE);
  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = `web_${crypto.randomUUID().replace(/-/g, '')}`;
    localStorage.setItem(CLIENT_ID_STORAGE, id);
  }
  return id;
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Client-Id': getClientId(),
  };
}

interface KeysState {
  keys: TemplateApiKey[];
  loading: boolean;
  error: string | null;
}

let state: KeysState = { keys: [], loading: true, error: null };
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
const serverState: KeysState = { keys: [], loading: true, error: null };
const getServerSnapshot = () => serverState;

let loaded = false;
// Version counter guards against a slow initial fetch overwriting newer mutations.
let mutationVersion = 0;

export async function refreshKeys(): Promise<void> {
  const versionAtStart = mutationVersion;
  try {
    const res = await fetch(`${API_BASE}/keys`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to load keys (${res.status})`);
    const keys: TemplateApiKey[] = await res.json();
    if (versionAtStart !== mutationVersion) return; // a mutation happened meanwhile; its state wins
    setState({ keys, loading: false, error: null });
  } catch (e) {
    if (versionAtStart !== mutationVersion) return;
    setState({ loading: false, error: e instanceof Error ? e.message : 'Failed to load keys' });
  }
}

export async function requestKeyFor(templateId: string): Promise<TemplateApiKey> {
  const res = await fetch(`${API_BASE}/keys`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ templateId }),
  });
  if (!res.ok) throw new Error('Failed to issue API key');
  const entry: TemplateApiKey = await res.json();
  mutationVersion++;
  setState({
    keys: [entry, ...state.keys.filter((k) => k.templateId !== templateId)],
    loading: false,
    error: null,
  });
  return entry;
}

export async function regenerateKeyFor(templateId: string): Promise<TemplateApiKey> {
  const res = await fetch(`${API_BASE}/keys/${encodeURIComponent(templateId)}/regenerate`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to regenerate API key');
  const entry: TemplateApiKey = await res.json();
  mutationVersion++;
  setState({
    keys: state.keys.map((k) => (k.templateId === templateId ? entry : k)),
    error: null,
  });
  return entry;
}

export async function revokeKeyFor(templateId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/keys/${encodeURIComponent(templateId)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to revoke API key');
  mutationVersion++;
  setState({ keys: state.keys.filter((k) => k.templateId !== templateId), error: null });
}

/** Revoke every key issued to this browser's identity (used by Settings "clear data"). */
export async function revokeAllKeys(): Promise<void> {
  const res = await fetch(`${API_BASE}/keys`, { headers: headers() });
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
    headers: headers(),
    body: JSON.stringify(request),
  });
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
    getKeyFor: (templateId: string) => snapshot.keys.find((k) => k.templateId === templateId) ?? null,
    requestKeyFor,
    regenerateKeyFor,
    revokeKeyFor,
  };
}
