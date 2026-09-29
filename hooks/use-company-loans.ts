'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/database';

export function useCompanyLoans() {
  const loans = useLiveQuery(() => db.companyLoans.orderBy('issuedOn').reverse().toArray(), []);
  return { loans: loans ?? [], isLoading: loans === undefined };
}
