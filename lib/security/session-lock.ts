import 'client-only';

import type { SecuritySettings } from '@/types/domain';

const SESSION_UNLOCK_KEY = 'live-salary-ticker-unlocked-security-version';
const SESSION_UNLOCK_EVENT = 'live-salary-ticker-unlock-change';

export function getSecuritySessionVersion(): string {
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) ?? '';
}

export function markSecuritySessionUnlocked(securitySettings: SecuritySettings): void {
  sessionStorage.setItem(SESSION_UNLOCK_KEY, securitySettings.updatedAt);
  window.dispatchEvent(new Event(SESSION_UNLOCK_EVENT));
}

export function clearSecuritySession(): void {
  sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  window.dispatchEvent(new Event(SESSION_UNLOCK_EVENT));
}

export function subscribeToSecuritySession(listener: () => void): () => void {
  window.addEventListener(SESSION_UNLOCK_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(SESSION_UNLOCK_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
