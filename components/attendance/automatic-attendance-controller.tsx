'use client';

import { useEffect } from 'react';
import { getAutomaticAttendanceCandidate } from '@/lib/attendance/auto-attendance';
import { saveAutomaticAttendanceIfMissing } from '@/lib/database/repository';
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
  const joiningDate = profile?.joiningDate;
  const autoAttendanceRule = salarySettings?.autoAttendanceRule;
  const autoAttendanceTime = salarySettings?.autoAttendanceTime;
  const dutyStart = salarySettings?.dutyStart;
  const dutyEnd = salarySettings?.dutyEnd;
  const weeklyOffDay = salarySettings?.weeklyOffDay;

  useEffect(() => {
    if (!joiningDate || !autoAttendanceRule || !dutyStart || !dutyEnd || weeklyOffDay === undefined) return;

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
        const wasCreated = await saveAutomaticAttendanceIfMissing(candidate);
        if (wasCreated && isActive) onRecordCreated(candidate.date);
      } catch {
        // Local automation is non-critical. The attendance editor remains available for manual entries.
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
