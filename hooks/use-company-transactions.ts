'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCompanyTransactions } from '@/lib/supabase/repository';
import type { CompanyTransaction } from '@/types/domain';
import type { CompanyTxRow } from '@/lib/supabase/database.types';

function toCompanyTransaction(row: CompanyTxRow): CompanyTransaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    note: row.note,
    loanId: row.loan_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCompanyTransactions() {
  const { userId, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setIsLoading(true);
    const result = await getCompanyTransactions(uid);
    setTransactions(result.data?.map(toCompanyTransaction) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      load(userId);
    } else if (!authLoading) {
      setTransactions([]);
      setIsLoading(false);
    }
  }, [userId, authLoading, load]);

  const refetch = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { transactions, isLoading: authLoading || isLoading, refetch };
}
