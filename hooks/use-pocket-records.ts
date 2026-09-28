import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';

export function usePocketRecords() {
  const records = useLiveQuery(async () => {
    const [transactions, goals] = await Promise.all([
      db.pocketTransactions.orderBy('occurredOn').reverse().toArray(),
      db.savingsGoals.orderBy('updatedAt').reverse().toArray(),
    ]);
    return { transactions, goals };
  }, []);

  return {
    transactions: records?.transactions ?? [],
    goals: records?.goals ?? [],
    isLoading: records === undefined,
  };
}
