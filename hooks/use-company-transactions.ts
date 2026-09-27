'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';

export function useCompanyTransactions() {
  const transactions = useLiveQuery(() => db.companyTransactions.orderBy('occurredOn').reverse().toArray(), []);
  return { transactions: transactions ?? [], isLoading: transactions === undefined };
}
