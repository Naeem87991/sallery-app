import type { SalarySettings, UserProfile } from '@/types/domain';

export type EarningsStatus = 'before-joining' | 'weekly-off-paid' | 'weekly-off-unpaid' | 'before-shift' | 'earning' | 'shift-complete';

export type LiveEarningsSnapshot = {
  earned: number;
  dailyRate: number;
  hourlyRate: number;
  progress: number;
  shiftStart: Date;
  shiftEnd: Date;
  status: EarningsStatus;
};

const millisecondsPerHour = 60 * 60 * 1000;

export function calculateLiveEarnings(
  salarySettings: SalarySettings,
  profile: Pick<UserProfile, 'joiningDate'>,
  now: Date,
): LiveEarningsSnapshot {
  const dailyRate = calculateDailyRate(salarySettings, now);
  const shiftDurationHours = getSafeShiftDuration(salarySettings.shiftDurationHours);
  const hourlyRate = dailyRate / shiftDurationHours;
  const shift = getRelevantShift(salarySettings, now);
  const shiftDate = startOfLocalDay(shift.start);
  const joiningDate = parseLocalDate(profile.joiningDate);

  if (joiningDate && shiftDate < joiningDate) {
    return createSnapshot({ dailyRate, hourlyRate, shift, status: 'before-joining' });
  }

  if (shift.start.getDay() === salarySettings.weeklyOffDay) {
    return createSnapshot({
      dailyRate,
      hourlyRate,
      shift,
      earned: salarySettings.isWeeklyOffPaid ? dailyRate : 0,
      progress: salarySettings.isWeeklyOffPaid ? 1 : 0,
      status: salarySettings.isWeeklyOffPaid ? 'weekly-off-paid' : 'weekly-off-unpaid',
    });
  }

  if (now < shift.start) {
    return createSnapshot({ dailyRate, hourlyRate, shift, status: 'before-shift' });
  }

  if (now >= shift.end) {
    return createSnapshot({ dailyRate, hourlyRate, shift, earned: dailyRate, progress: 1, status: 'shift-complete' });
  }

  const scheduledDuration = Math.max(shift.end.getTime() - shift.start.getTime(), 1);
  const earningDuration = shiftDurationHours * millisecondsPerHour;
  const elapsed = now.getTime() - shift.start.getTime();
  const progress = clamp(elapsed / scheduledDuration);

  return createSnapshot({
    dailyRate,
    hourlyRate,
    shift,
    earned: Math.min(dailyRate, (elapsed / earningDuration) * dailyRate),
    progress,
    status: 'earning',
  });
}

export function calculateDailyRate(salarySettings: SalarySettings, now: Date): number {
  if (salarySettings.salaryMode === 'daily-rate') return getSafeMoneyAmount(salarySettings.dailyRate);

  switch (salarySettings.salaryCalculationRule) {
    case '26-working-days':
      return getSafeMoneyAmount(salarySettings.baseSalary) / 26;
    case 'calendar-days':
      return getSafeMoneyAmount(salarySettings.baseSalary) / getDaysInMonth(now);
    case '30-days':
    default:
      return getSafeMoneyAmount(salarySettings.baseSalary) / 30;
  }
}

function getRelevantShift(salarySettings: SalarySettings, now: Date) {
  const todaysShift = createShiftForDay(salarySettings, now, 0);
  const yesterdaysShift = createShiftForDay(salarySettings, now, -1);

  if (now >= yesterdaysShift.start && now < yesterdaysShift.end) return yesterdaysShift;
  return todaysShift;
}

function createShiftForDay(salarySettings: SalarySettings, now: Date, dayOffset: number) {
  const shiftStart = atLocalTime(now, dayOffset, salarySettings.dutyStart);
  const shiftEnd = atLocalTime(now, dayOffset, salarySettings.dutyEnd);

  if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);
  return { start: shiftStart, end: shiftEnd };
}

function createSnapshot({
  dailyRate,
  hourlyRate,
  shift,
  earned = 0,
  progress = 0,
  status,
}: Pick<LiveEarningsSnapshot, 'dailyRate' | 'hourlyRate' | 'status'> & Partial<Pick<LiveEarningsSnapshot, 'earned' | 'progress'>> & { shift: { start: Date; end: Date } }): LiveEarningsSnapshot {
  return { dailyRate, hourlyRate, earned, progress, status, shiftStart: shift.start, shiftEnd: shift.end };
}

function atLocalTime(date: Date, dayOffset: number, time: string): Date {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, hour, minute, 0, 0);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getSafeShiftDuration(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function getSafeMoneyAmount(value: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}
