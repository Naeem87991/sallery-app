'use client';

/**
 * Security settings (PIN hash, passkey) remain in IndexedDB ONLY.
 * They are cryptographic secrets that must never be sent to any server.
 * This hook still reads from Dexie — intentionally kept as-is.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';
import { CURRENT_RECORD_ID } from '@/types/domain';

export function useSecuritySettings() {
  const result = useLiveQuery(
    async () => ({ settings: (await db.securitySettings.get(CURRENT_RECORD_ID)) ?? null }),
    [],
  );

  return {
    settings: result?.settings ?? null,
    isLoading: result === undefined,
  };
}
