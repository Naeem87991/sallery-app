import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';

export function useAllAttendanceRecords() {
  const records = useLiveQuery(() => db.attendanceRecords.orderBy('date').reverse().toArray(), []);
  return { records: records ?? [], isLoading: records === undefined };
}
