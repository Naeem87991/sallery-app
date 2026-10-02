'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCompanyLoans } from '@/lib/supabase/repository';
import type { CompanyLoan } from '@/types/domain';
import type { CompanyLoanRow } from '@/lib/supabase/database.types';

function toCompanyLoan(row: CompanyLoanRow): CompanyLoan {
  return {
    id: row.id,
    name: row.name,
    principalAmount: Number(row.principal_amount),
    issuedOn: row.issued_on,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCompanyLoans() {
  const { userId, isLoading: authLoading } = useAuth();
  const [loans, setLoans] = useState<CompanyLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setIsLoading(true);
    const result = await getCompanyLoans(uid);
    setLoans(result.data?.map(toCompanyLoan) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      load(userId);
    } else if (!authLoading) {
      setLoans([]);
      setIsLoading(false);
    }
  }, [userId, authLoading, load]);

  const refetch = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { loans, isLoading: authLoading || isLoading, refetch };
}
