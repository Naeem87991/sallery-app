'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProfile, getAppSettings } from '@/lib/supabase/repository';
import type { ProfileRow } from '@/lib/supabase/database.types';
import type { AppSettings, SalarySettings, UserProfile } from '@/types/domain';
import { CURRENT_RECORD_ID } from '@/types/domain';

// ── Map Supabase profile row → domain types ───────────────────

function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: CURRENT_RECORD_ID,
    firstName: row.first_name,
    lastName: row.last_name,
    employeeId: row.employee_id,
    designation: row.designation,
    joiningDate: row.joining_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSalarySettings(row: ProfileRow): SalarySettings {
  return {
    id: CURRENT_RECORD_ID,
    salaryMode: row.salary_mode,
    baseSalary: Number(row.base_salary),
    dailyRate: row.daily_rate != null ? Number(row.daily_rate) : null,
    salaryCalculationRule: row.salary_calculation_rule,
    dutyStart: row.duty_start,
    dutyEnd: row.duty_end,
    shiftDurationHours: Number(row.shift_duration_hours),
    weeklyOffDay: row.weekly_off_day,
    isWeeklyOffPaid: row.is_weekly_off_paid,
    autoAttendanceRule: row.auto_attendance_rule,
    autoAttendanceTime: row.auto_attendance_time,
    halfDayFactor: Number(row.half_day_factor),
    currency: 'PKR',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Hook ─────────────────────────────────────────────────────

type AppRecords = {
  profile: UserProfile | undefined;
  salarySettings: SalarySettings | undefined;
  appSettings: AppSettings | undefined;
};

export function useCurrentAppRecords() {
  const { userId, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<AppRecords | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);

  const load = useCallback(async (uid: string) => {
    setIsFetching(true);
    const [profileResult, settingsResult] = await Promise.all([
      getProfile(uid),
      getAppSettings(uid),
    ]);

    const profileRow = profileResult.data;
    const settingsRow = settingsResult.data;

    setRecords({
      profile: profileRow ? toUserProfile(profileRow) : undefined,
      salarySettings: profileRow ? toSalarySettings(profileRow) : undefined,
      appSettings: settingsRow
        ? {
            id: CURRENT_RECORD_ID,
            theme: settingsRow.theme,
            language: settingsRow.language,
            isPrivacyModeEnabled: settingsRow.is_privacy_mode_enabled,
            lowCashThreshold: Number(settingsRow.low_cash_threshold),
            createdAt: settingsRow.created_at,
            updatedAt: settingsRow.updated_at,
          }
        : undefined,
    });
    setIsFetching(false);
  }, []);

  useEffect(() => {
    if (userId) {
      load(userId);
    } else if (!authLoading) {
      // Auth resolved but no user — clear records
      setRecords({ profile: undefined, salarySettings: undefined, appSettings: undefined });
    }
  }, [userId, authLoading, load]);

  // Expose a refetch function so components can trigger reload after save
  const refetch = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  const isLoading = authLoading || isFetching || records === undefined;

  return {
    records,
    isLoading,
    isOnboarded: Boolean(records?.profile && records.salarySettings && records.appSettings),
    refetch,
  };
}
