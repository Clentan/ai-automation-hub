import { useEffect, useState } from 'react';
import type { Template } from './data';

const API_BASE = `${import.meta.env.BASE_URL}api`;

// Module-level cache so every page shares one fetch per session and
// synchronous lookups (e.g. flows) can resolve templates by id.
let cache: Template[] | null = null;
let inflight: Promise<Template[]> | null = null;

export function fetchTemplates(): Promise<Template[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch(`${API_BASE}/templates`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
        return res.json() as Promise<Template[]>;
      })
      .then((templates) => {
        cache = templates;
        return templates;
      })
      .catch((err) => {
        inflight = null; // allow retry on next call
        throw err;
      });
  }
  return inflight;
}

/** Drop the cached catalog (e.g. after an admin edit) so the next mount refetches. */
export function invalidateTemplatesCache() {
  cache = null;
  inflight = null;
}

/** Synchronous lookup from the cache (empty until templates have loaded). */
export function getCachedTemplate(id: string): Template | undefined {
  return cache?.find((t) => t.id === id);
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(cache ?? []);
  const [isLoading, setIsLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetchTemplates()
      .then((t) => {
        if (!cancelled) {
          setTemplates(t);
          setIsLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, isLoading, error };
}
