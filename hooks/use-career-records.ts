import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';

export function useCareerRecords() {
  const records = useLiveQuery(() => db.careerRecords.orderBy('startDate').reverse().toArray(), []);

  return { records: records ?? [], isLoading: records === undefined };
}
