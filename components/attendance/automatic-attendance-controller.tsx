'use client';

import { useEffect } from 'react';
import { getAutomaticAttendanceCandidate } from '@/lib/attendance/auto-attendance';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { SalarySettings, UserProfile } from '@/types/domain';

const checkIntervalMilliseconds = 60_000;

export function AutomaticAttendanceController({
  profile,
  salarySettings,
  onRecordCreated,
}: {
  profile?: Pick<UserProfile, 'joiningDate'>;
  salarySettings?: Pick<SalarySettings, 'autoAttendanceRule' | 'autoAttendanceTime' | 'dutyStart' | 'dutyEnd' | 'weeklyOffDay'>;
  onRecordCreated: (date: string) => void;
}) {
  const { userId } = useAuth();
  const joiningDate = profile?.joiningDate;
  const autoAttendanceRule = salarySettings?.autoAttendanceRule;
  const autoAttendanceTime = salarySettings?.autoAttendanceTime;
  const dutyStart = salarySettings?.dutyStart;
  const dutyEnd = salarySettings?.dutyEnd;
  const weeklyOffDay = salarySettings?.weeklyOffDay;

  useEffect(() => {
    if (!userId || !joiningDate || !autoAttendanceRule || !dutyStart || !dutyEnd || weeklyOffDay === undefined) return;

    let isActive = true;
    let isChecking = false;

    const checkForMissingAttendance = async () => {
      if (document.visibilityState === 'hidden' || isChecking) return;
      const candidate = getAutomaticAttendanceCandidate({
        salarySettings: { autoAttendanceRule, autoAttendanceTime: autoAttendanceTime ?? null, dutyStart, dutyEnd, weeklyOffDay },
        joiningDate,
        now: new Date(),
      });
      if (!candidate) return;

      isChecking = true;
      try {
        const sb = createClient();
        // Check if a record already exists for this date
        const { data: existing } = await sb
          .from('attendance_records')
          .select('id')
          .eq('user_id', userId)
          .eq('date', candidate.date)
          .maybeSingle();

        if (existing) return; // already recorded — nothing to do

        const { error } = await sb.from('attendance_records').insert({
          user_id: userId,
          date: candidate.date,
          status: candidate.status,
          check_in: null,
          check_out: null,
          overtime_minutes: 0,
          note: candidate.note,
        });

        if (!error && isActive) onRecordCreated(candidate.date);
      } catch {
        // Automatic attendance is non-critical — errors are silent.
        // The attendance editor remains available for manual entries.
      } finally {
        isChecking = false;
      }
    };

    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') void checkForMissingAttendance();
    };

    void checkForMissingAttendance();
    const interval = window.setInterval(() => void checkForMissingAttendance(), checkIntervalMilliseconds);
    window.addEventListener('focus', checkWhenVisible);
    document.addEventListener('visibilitychange', checkWhenVisible);

    return () => {
      isActive = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', checkWhenVisible);
      document.removeEventListener('visibilitychange', checkWhenVisible);
    };
  }, [
    userId,
    onRecordCreated,
    autoAttendanceRule,
    autoAttendanceTime,
    dutyEnd,
    dutyStart,
    joiningDate,
    weeklyOffDay,
  ]);

  return null;
}
