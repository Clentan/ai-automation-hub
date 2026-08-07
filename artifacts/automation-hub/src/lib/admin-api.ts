const API_BASE = `${import.meta.env.BASE_URL}api`;
const TOKEN_STORAGE = 'ai-automation-hub-admin-token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_STORAGE, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_STORAGE);
}

export class AdminAuthError extends Error {}

export async function adminFetch<T>(
  path: string,
  token: string | null,
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.headers ?? {}),
      // With no token, the signed-in session cookie is used; the backend
      // grants access when the account email is listed in ADMIN_EMAILS.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // Admin endpoints return 404 for bad/missing tokens; treat GET 404s as auth failures.
  if (res.status === 404 && (!init?.method || init.method === 'GET')) {
    throw new AdminAuthError('Access denied');
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

const ADMIN_PROBE_STORAGE = 'ai-automation-hub-is-admin-v2';
export interface TemplateRequest {
  id: string;
  title: string;
  tools: string;
  description: string;
  status: string;
  created_at: string;
}

export interface AdminStats {
  registeredUsers: number | null;
  clients: number;
  keysIssued: number;
  templatesWithKeys: number;
  requestsTotal: number;
  requestsByStatus: Record<string, number>;
  runsTotal: number;
  runsByStatus: Record<string, number>;
  runsByTemplate: Record<string, number>;
  recentRuns: { id: string; template_id: string; client_id: string; status: string; created_at: string }[];
}

export interface AdminTemplate {
  id: string;
  name: string;
  description: string;
  author: string;
  type: string;
  categories: string[];
  usageCount: number;
  services: string[];
  steps: { title: string; description: string; serviceId: string }[];
  createdAt: string;
  available: boolean;
  documentation: string;
  webhookUrl: string;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string | number | null;
  lastSignInAt: string | number | null;
  keys: { templateId: string; keyPrefix: string; createdAt: string }[];
  runsTotal: number;
}

export interface AdminKeyRow {
  clientId: string;
  templateId: string;
  keySuffix: string;
  createdAt: string;
}

const adminProbes = new Map<string, Promise<boolean>>();

/**
 * Probes GET /api/admin/stats once per browser session for the given
 * signed-in user (Clerk user id), using the session cookie. Resolves true
 * only on a 200 (owner); 404/anything else means no admin access.
 * Caching is keyed by user id so a result from before sign-in (or from a
 * different account) is never reused.
 */
export function probeAdminAccess(userId: string): Promise<boolean> {
  const storageKey = `${ADMIN_PROBE_STORAGE}:${userId}`;
  const cached = sessionStorage.getItem(storageKey);
  if (cached !== null) return Promise.resolve(cached === 'true');
  let probe = adminProbes.get(userId);
  if (!probe) {
    probe = fetch(`${API_BASE}/admin/stats`, { credentials: 'same-origin' })
      .then((res) => {
        const isAdmin = res.ok;
        sessionStorage.setItem(storageKey, String(isAdmin));
        return isAdmin;
      })
      .catch(() => {
        // Network failure: don't cache, allow a retry on next mount.
        adminProbes.delete(userId);
        return false;
      });
    adminProbes.set(userId, probe);
  }
  return probe;
}

export function clearAdminProbe() {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key === ADMIN_PROBE_STORAGE || key?.startsWith(`${ADMIN_PROBE_STORAGE}:`)) {
      sessionStorage.removeItem(key);
    }
  }
  adminProbes.clear();
}
