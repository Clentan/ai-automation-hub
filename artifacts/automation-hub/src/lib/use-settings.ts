import { useSyncExternalStore } from 'react';

export interface UserSettings {
  name: string;
  email: string;
  notifications: boolean;
}

const SETTINGS_KEY = 'ai-automation-hub-settings';

const defaultSettings: UserSettings = {
  name: 'Alex Developer',
  email: 'alex@example.com',
  notifications: true,
};

function sanitize(raw: unknown): UserSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name : defaultSettings.name,
    email: typeof obj.email === 'string' && obj.email.trim() ? obj.email : defaultSettings.email,
    notifications:
      typeof obj.notifications === 'boolean' ? obj.notifications : defaultSettings.notifications,
  };
}

function load(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return sanitize(JSON.parse(stored));
  } catch (e) {
    console.error('Failed to parse settings', e);
  }
  return defaultSettings;
}

// Module-level store shared by every component that calls useSettings.
let current: UserSettings = typeof window !== 'undefined' ? load() : defaultSettings;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return current;
}

export function updateSettingsStore(updates: Partial<UserSettings>) {
  current = sanitize({ ...current, ...updates });
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to persist settings', e);
  }
  listeners.forEach((l) => l());
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => defaultSettings);
  return { settings, updateSettings: updateSettingsStore, isLoaded: true };
}
