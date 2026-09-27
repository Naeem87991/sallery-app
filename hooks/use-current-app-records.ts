'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';
import { CURRENT_RECORD_ID } from '@/types/domain';

export function useCurrentAppRecords() {
  const records = useLiveQuery(async () => {
    const [profile, salarySettings, appSettings] = await Promise.all([
      db.profiles.get(CURRENT_RECORD_ID),
      db.salarySettings.get(CURRENT_RECORD_ID),
      db.appSettings.get(CURRENT_RECORD_ID),
    ]);
    return { profile, salarySettings, appSettings };
  }, []);

  return {
    records,
    isLoading: records === undefined,
    isOnboarded: Boolean(records?.profile && records.salarySettings && records.appSettings),
  };
}
