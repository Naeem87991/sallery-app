'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCareerRecords } from '@/lib/supabase/repository';
import type { CareerRecord } from '@/types/domain';
import type { CareerRow } from '@/lib/supabase/database.types';

function toCareerRecord(row: CareerRow): CareerRecord {
  return {
    id: row.id,
    companyName: row.company_name,
    designation: row.designation,
    startDate: row.start_date,
    endDate: row.end_date,
    monthlySalary: Number(row.monthly_salary),
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCareerRecords() {
  const { userId, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setIsLoading(true);
    const result = await getCareerRecords(uid);
    setRecords(result.data?.map(toCareerRecord) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      load(userId);
    } else if (!authLoading) {
      setRecords([]);
      setIsLoading(false);
    }
  }, [userId, authLoading, load]);

  const refetch = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { records, isLoading: authLoading || isLoading, refetch };
}
