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
  token: string,
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  // Admin endpoints return 404 for bad/missing tokens; treat GET 404s as auth failures.
  if (res.status === 404 && (!init?.method || init.method === 'GET')) {
    throw new AdminAuthError('Access denied');
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export interface TemplateRequest {
  id: string;
  title: string;
  tools: string;
  description: string;
  status: string;
  created_at: string;
}

export interface AdminStats {
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

export interface AdminKeyRow {
  clientId: string;
  templateId: string;
  keySuffix: string;
  createdAt: string;
}
