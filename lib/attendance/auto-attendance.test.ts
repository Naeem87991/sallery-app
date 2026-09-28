import { describe, expect, it } from 'vitest';

import { getAutomaticAttendanceCandidate } from '@/lib/attendance/auto-attendance';
import type { SalarySettings } from '@/types/domain';

function rules(overrides: Partial<SalarySettings> = {}): Pick<SalarySettings, 'autoAttendanceRule' | 'autoAttendanceTime' | 'dutyStart' | 'dutyEnd' | 'weeklyOffDay'> {
  return {
    autoAttendanceRule: 'off',
    autoAttendanceTime: null,
    dutyStart: '09:00',
    dutyEnd: '17:00',
    weeklyOffDay: 0,
    ...overrides,
  };
}

describe('automatic attendance candidates', () => {
  it('does nothing when the automatic rule is disabled', () => {
    expect(getAutomaticAttendanceCandidate({ salarySettings: rules(), joiningDate: '2025-01-01', now: new Date(2025, 0, 6, 12) })).toBeNull();
  });

  it('uses the completed day for the midnight rule', () => {
    expect(getAutomaticAttendanceCandidate({ salarySettings: rules({ autoAttendanceRule: 'midnight' }), joiningDate: '2025-01-01', now: new Date(2025, 0, 7, 0, 5) })).toMatchObject({ date: '2025-01-06', status: 'present' });
  });

  it('uses today only after a custom trigger time', () => {
    const salarySettings = rules({ autoAttendanceRule: 'custom-time', autoAttendanceTime: '14:30' });

    expect(getAutomaticAttendanceCandidate({ salarySettings, joiningDate: '2025-01-01', now: new Date(2025, 0, 7, 14, 29) })).toMatchObject({ date: '2025-01-06' });
    expect(getAutomaticAttendanceCandidate({ salarySettings, joiningDate: '2025-01-01', now: new Date(2025, 0, 7, 14, 30) })).toMatchObject({ date: '2025-01-07' });
  });

  it('handles both normal and overnight shift ends', () => {
    expect(getAutomaticAttendanceCandidate({ salarySettings: rules({ autoAttendanceRule: 'shift-end' }), joiningDate: '2025-01-01', now: new Date(2025, 0, 6, 17) })).toMatchObject({ date: '2025-01-06' });
    expect(getAutomaticAttendanceCandidate({ salarySettings: rules({ autoAttendanceRule: 'shift-end', dutyStart: '22:00', dutyEnd: '06:00' }), joiningDate: '2025-01-01', now: new Date(2025, 0, 7, 6) })).toMatchObject({ date: '2025-01-06' });
  });

  it('never creates candidates before joining or on a weekly off', () => {
    expect(getAutomaticAttendanceCandidate({ salarySettings: rules({ autoAttendanceRule: 'midnight' }), joiningDate: '2025-01-07', now: new Date(2025, 0, 7, 0, 5) })).toBeNull();
    expect(getAutomaticAttendanceCandidate({ salarySettings: rules({ autoAttendanceRule: 'midnight', weeklyOffDay: 1 }), joiningDate: '2025-01-01', now: new Date(2025, 0, 7, 0, 5) })).toBeNull();
  });
});
