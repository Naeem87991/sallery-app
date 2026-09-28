import type { SalarySettings } from '@/types/domain';

export type AutomaticAttendanceCandidate = {
  date: string;
  status: 'present';
  note: string;
};

export function getAutomaticAttendanceCandidate({
  salarySettings,
  joiningDate,
  now,
}: {
  salarySettings: Pick<SalarySettings, 'autoAttendanceRule' | 'autoAttendanceTime' | 'dutyStart' | 'dutyEnd' | 'weeklyOffDay'>;
  joiningDate: string;
  now: Date;
}): AutomaticAttendanceCandidate | null {
  if (salarySettings.autoAttendanceRule === 'off' || !isValidLocalDate(joiningDate)) return null;

  const date = getCandidateDate(salarySettings, now);
  if (!date || date < joiningDate || getLocalWeekday(date) === salarySettings.weeklyOffDay) return null;

  return {
    date,
    status: 'present',
    note: 'Marked automatically from your attendance rule.',
  };
}

function getCandidateDate(
  salarySettings: Pick<SalarySettings, 'autoAttendanceRule' | 'autoAttendanceTime' | 'dutyStart' | 'dutyEnd'>,
  now: Date,
): string | null {
  switch (salarySettings.autoAttendanceRule) {
    case 'midnight':
      return getLocalDateValue(addLocalDays(now, -1));
    case 'custom-time':
      return getCustomTimeCandidateDate(salarySettings.autoAttendanceTime, now);
    case 'shift-end':
      return getLatestCompletedShiftDate(salarySettings.dutyStart, salarySettings.dutyEnd, now);
    case 'off':
    default:
      return null;
  }
}

function getCustomTimeCandidateDate(time: string | null, now: Date): string | null {
  const trigger = parseLocalTime(time);
  if (!trigger) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return getLocalDateValue(nowMinutes >= trigger.minutes ? now : addLocalDays(now, -1));
}

function getLatestCompletedShiftDate(dutyStart: string, dutyEnd: string, now: Date): string | null {
  const start = parseLocalTime(dutyStart);
  const end = parseLocalTime(dutyEnd);
  if (!start || !end) return null;

  const today = getShiftForDate(now, start, end);
  if (now >= today.end) return getLocalDateValue(today.start);

  const yesterdayReference = addLocalDays(now, -1);
  const yesterday = getShiftForDate(yesterdayReference, start, end);
  return now >= yesterday.end ? getLocalDateValue(yesterday.start) : null;
}

function getShiftForDate(date: Date, start: LocalTime, end: LocalTime): { start: Date; end: Date } {
  const shiftStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), start.hour, start.minute, 0, 0);
  const shiftEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), end.hour, end.minute, 0, 0);
  if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);
  return { start: shiftStart, end: shiftEnd };
}

type LocalTime = { hour: number; minute: number; minutes: number };

function parseLocalTime(value: string | null): LocalTime | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute, minutes: hour * 60 + minute };
}

function getLocalDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

function getLocalWeekday(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

function isValidLocalDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
