'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';

export function useAttendanceRecords(month: string) {
  const records = useLiveQuery(() => {
    const [year, monthIndex] = month.split('-').map(Number);
    const lastDay = new Date(year, monthIndex, 0).getDate();
    return db.attendanceRecords.where('date').between(`${month}-01`, `${month}-${String(lastDay).padStart(2, '0')}`, true, true).toArray();
  }, [month]);

  return { records: records ?? [], isLoading: records === undefined };
}
