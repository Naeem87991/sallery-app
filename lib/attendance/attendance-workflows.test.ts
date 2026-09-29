import { describe, expect, it } from 'vitest';

import { findNextUnrecordedWorkday } from '@/lib/attendance/attendance-workflows';
import type { AttendanceRecord } from '@/types/domain';

const audit = { createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' };
const record = (date: string): AttendanceRecord => ({ ...audit, id: date, date, status: 'present', checkIn: null, checkOut: null, overtimeMinutes: 0, note: '' });

describe('attendance workflow helpers', () => {
  it('finds the next blank workday while skipping saved records, weekly offs, and future dates', () => {
    expect(findNextUnrecordedWorkday({ month: '2025-01', selectedDate: '2025-01-02', records: [record('2025-01-03')], weeklyOffDay: 0, joiningDate: '2025-01-01', throughDate: '2025-01-06' })).toBe('2025-01-04');
  });

  it('wraps to the earliest eligible blank day and returns null when every workday is recorded', () => {
    expect(findNextUnrecordedWorkday({ month: '2025-01', selectedDate: '2025-01-04', records: [record('2025-01-01'), record('2025-01-03')], weeklyOffDay: 0, joiningDate: '2025-01-01', throughDate: '2025-01-04' })).toBe('2025-01-02');
    expect(findNextUnrecordedWorkday({ month: '2025-01', selectedDate: '2025-01-01', records: [record('2025-01-01'), record('2025-01-02'), record('2025-01-03'), record('2025-01-04')], weeklyOffDay: 0, joiningDate: '2025-01-01', throughDate: '2025-01-04' })).toBeNull();
  });
});
