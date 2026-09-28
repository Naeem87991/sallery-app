import type { CareerRecord, SalarySettings } from '@/types/domain';

function asUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function daysInclusive(startDate: string, endDate: string): number {
  const milliseconds = asUtcDate(endDate).getTime() - asUtcDate(startDate).getTime();
  return Math.max(0, Math.floor(milliseconds / 86_400_000) + 1);
}

export function calculateCareerRecordEarnings(record: CareerRecord): number {
  const days = daysInclusive(record.startDate, record.endDate);
  return (record.monthlySalary / 30) * days;
}

export function getCareerLifetimeEarnings(records: CareerRecord[]): number {
  return records.reduce((total, record) => total + calculateCareerRecordEarnings(record), 0);
}

export function getEstimatedMonthlySalary(salarySettings: SalarySettings): number {
  return salarySettings.salaryMode === 'daily-rate'
    ? (salarySettings.dailyRate ?? salarySettings.baseSalary) * 26
    : salarySettings.baseSalary;
}

export function calculateCurrentRoleEarnings(joiningDate: string, monthlySalary: number, asOfDate: Date): number {
  const days = Math.max(0, Math.floor((asOfDate.getTime() - asUtcDate(joiningDate).getTime()) / 86_400_000) + 1);
  return (monthlySalary / 30) * days;
}
