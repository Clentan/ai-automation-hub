import { useSyncExternalStore } from 'react';

export interface TemplateApiKey {
  templateId: string;
  key: string;
  createdAt: string;
}

const KEYS_STORAGE = 'ai-automation-hub-template-keys';

function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `aah_tpl_${s}`;
}

function sanitize(raw: unknown): TemplateApiKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (k: unknown): k is TemplateApiKey =>
      !!k &&
      typeof k === 'object' &&
      typeof (k as TemplateApiKey).templateId === 'string' &&
      typeof (k as TemplateApiKey).key === 'string' &&
      typeof (k as TemplateApiKey).createdAt === 'string'
  );
}

function load(): TemplateApiKey[] {
  try {
    const stored = localStorage.getItem(KEYS_STORAGE);
    if (stored) return sanitize(JSON.parse(stored));
  } catch (e) {
    console.error('Failed to parse API keys', e);
  }
  return [];
}

let current: TemplateApiKey[] = typeof window !== 'undefined' ? load() : [];
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to persist API keys', e);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => current;
const getServerSnapshot = (): TemplateApiKey[] => [];

export function requestKeyFor(templateId: string): TemplateApiKey {
  const existing = current.find((k) => k.templateId === templateId);
  if (existing) return existing;
  const entry: TemplateApiKey = {
    templateId,
    key: generateKey(),
    createdAt: new Date().toISOString(),
  };
  current = [entry, ...current];
  persist();
  return entry;
}

export function regenerateKeyFor(templateId: string): TemplateApiKey | null {
  const existing = current.find((k) => k.templateId === templateId);
  if (!existing) return null;
  const entry: TemplateApiKey = {
    templateId,
    key: generateKey(),
    createdAt: new Date().toISOString(),
  };
  current = current.map((k) => (k.templateId === templateId ? entry : k));
  persist();
  return entry;
}

export function revokeKeyFor(templateId: string) {
  current = current.filter((k) => k.templateId !== templateId);
  persist();
}

export function useApiKeys() {
  const keys = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    keys,
    getKeyFor: (templateId: string) => keys.find((k) => k.templateId === templateId) ?? null,
    requestKeyFor,
    regenerateKeyFor,
    revokeKeyFor,
  };
}
