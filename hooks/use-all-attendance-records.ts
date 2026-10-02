'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllAttendanceRecords } from '@/lib/supabase/repository';
import type { AttendanceRecord } from '@/types/domain';
import type { AttendanceRow } from '@/lib/supabase/database.types';

function toAttendanceRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.date,
    date: row.date,
    status: row.status,
    checkIn: row.check_in,
    checkOut: row.check_out,
    overtimeMinutes: row.overtime_minutes,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useAllAttendanceRecords() {
  const { userId, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setIsLoading(true);
    const result = await getAllAttendanceRecords(uid);
    setRecords(result.data?.map(toAttendanceRecord) ?? []);
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
