import type { AttendanceRecord } from '@/types/domain';

export function findNextUnrecordedWorkday({
  month,
  selectedDate,
  records,
  weeklyOffDay,
  joiningDate,
  throughDate,
}: {
  month: string;
  selectedDate: string;
  records: AttendanceRecord[];
  weeklyOffDay: number;
  joiningDate: string;
  throughDate: string;
}): string | null {
  const [year, monthIndex] = month.split('-').map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const existingDates = new Set(records.map((record) => record.date));
  const availableDates: string[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    if (date < joiningDate || date > throughDate || existingDates.has(date) || new Date(year, monthIndex - 1, day).getDay() === weeklyOffDay) continue;
    availableDates.push(date);
  }

  return availableDates.find((date) => date > selectedDate) ?? availableDates[0] ?? null;
}
