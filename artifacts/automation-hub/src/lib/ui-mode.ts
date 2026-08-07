import { useSyncExternalStore } from 'react';

/**
 * UI mode chosen on the landing page:
 * - 'simple': non-technical users — hide developer-oriented nav (Templates, Activity, API access)
 * - 'full': developers — full navigation
 */
export type UiMode = 'simple' | 'full';

const KEY = 'ah-ui-mode';
const EVENT = 'ah-ui-mode-change';

export function getUiMode(): UiMode {
  return localStorage.getItem(KEY) === 'simple' ? 'simple' : 'full';
}

export function setUiMode(mode: UiMode) {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useUiMode(): UiMode {
  return useSyncExternalStore(subscribe, getUiMode);
}
