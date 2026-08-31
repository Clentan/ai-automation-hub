import { useEffect, useSyncExternalStore } from 'react';
import { useUser } from '@clerk/react';

export interface UserSettings {
  notifications: boolean;
}

const API_BASE = `${import.meta.env.BASE_URL}api`;

interface SettingsState {
  /** The user ID whose preferences are currently loaded. null = no user loaded. */
  forUserId: string | null;
  settings: UserSettings;
  isLoaded: boolean;
  unauthorized: boolean;
  /** True when the last attempt to load settings from the server failed. */
  loadFailed: boolean;
}

// Email digests are opt-in server-side; mirror that default here.
const defaultSettings: UserSettings = { notifications: false };

const initialState: SettingsState = {
  forUserId: null,
  settings: defaultSettings,
  isLoaded: false,
  unauthorized: false,
  loadFailed: false,
};

let state: SettingsState = { ...initialState };
const listeners = new Set<() => void>();

function setState(next: Partial<SettingsState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => ({ ...initialState });

/** Clears the store and (re)fetches for the given user. Pass null to reset to signed-out state. */
export function resetSettingsForUser(userId: string | null): void {
  if (!userId) {
    setState({ ...initialState, isLoaded: true });
    return;
  }
  // Immediately mark as loading for the new user so stale values aren't shown.
  setState({ forUserId: userId, settings: defaultSettings, isLoaded: false, unauthorized: false, loadFailed: false });
  void fetchSettings(userId);
}

async function fetchSettings(userId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/settings`, { credentials: 'same-origin' });
    // Guard: another identity change may have fired while we were in flight.
    if (state.forUserId !== userId) return;
    if (res.status === 401) {
      setState({ settings: defaultSettings, isLoaded: true, unauthorized: true });
      return;
    }
    if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
    const data = await res.json();
    if (state.forUserId !== userId) return;
    setState({
      settings: { notifications: Boolean(data.emailNotifications) },
      isLoaded: true,
      unauthorized: false,
      loadFailed: false,
    });
  } catch (e) {
    console.error('Failed to load settings', e);
    if (state.forUserId === userId) {
      setState({ isLoaded: true, loadFailed: true });
    }
  }
}

/**
 * Persists the preference to the user's account. Throws on failure so the
 * caller can surface the error; the optimistic update is reverted on failure.
 */
export async function updateSettingsStore(updates: Partial<UserSettings>): Promise<void> {
  const previous = state.settings;
  const next = { ...previous, ...updates };
  setState({ settings: next });
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ emailNotifications: next.notifications }),
    });
    if (res.status === 401) {
      setState({ settings: previous, unauthorized: true });
      throw new Error('Sign in to change email notifications.');
    }
    if (!res.ok) throw new Error(`Failed to save settings (${res.status})`);
    const data = await res.json();
    setState({
      settings: { notifications: Boolean(data.emailNotifications) },
      unauthorized: false,
    });
  } catch (e) {
    setState({ settings: previous });
    throw e;
  }
}

export function useSettings() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!clerkLoaded) return;

    const userId = user?.id ?? null;

    // Only (re)fetch when the identity changes.
    if (snapshot.forUserId !== userId) {
      resetSettingsForUser(userId);
    }
  }, [clerkLoaded, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    settings: snapshot.settings,
    isLoaded: snapshot.isLoaded,
    unauthorized: snapshot.unauthorized,
    loadFailed: snapshot.loadFailed,
    updateSettings: updateSettingsStore,
    retryLoad: () => { if (snapshot.forUserId) resetSettingsForUser(snapshot.forUserId); },
  };
}
