import { describe, expect, it } from 'vitest';

import { calculateCareerRecordEarnings, calculateCurrentRoleEarnings, getCareerLifetimeEarnings } from '@/lib/calculations/career-earnings';
import { getCompanyBalance } from '@/lib/calculations/company-balance';
import { calculateDailyRate, calculateLiveEarnings } from '@/lib/calculations/earnings';
import { getPocketBalance } from '@/lib/calculations/pocket-balance';
import { assertSalaryRules, isValidLocalDate } from '@/lib/validation/domain';
import type { CareerRecord, CompanyTransaction, PocketTransaction, SalarySettings } from '@/types/domain';

const audit = { createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' };

function salarySettings(overrides: Partial<SalarySettings> = {}): SalarySettings {
  return {
    ...audit,
    id: 'current',
    salaryMode: 'fixed-monthly',
    baseSalary: 30_000,
    dailyRate: null,
    salaryCalculationRule: '30-days',
    dutyStart: '09:00',
    dutyEnd: '17:00',
    shiftDurationHours: 8,
    weeklyOffDay: 0,
    isWeeklyOffPaid: true,
    autoAttendanceRule: 'off',
    autoAttendanceTime: null,
    halfDayFactor: 0.5,
    currency: 'PKR',
    ...overrides,
  };
}

function companyTransaction(type: CompanyTransaction['type'], amount: number): CompanyTransaction {
  return { ...audit, id: `${type}-${amount}`, type, amount, occurredOn: '2025-01-06', note: '' };
}

function pocketTransaction(type: PocketTransaction['type'], amount: number): PocketTransaction {
  return { ...audit, id: `${type}-${amount}`, type, amount, occurredOn: '2025-01-06', note: '' };
}

function careerRecord(startDate: string, endDate: string, monthlySalary = 30_000): CareerRecord {
  return { ...audit, id: `${startDate}-${endDate}`, companyName: 'Example Co', designation: 'Analyst', startDate, endDate, monthlySalary, note: '' };
}

describe('salary calculations', () => {
  it('pro-rates a standard shift without exceeding the day rate', () => {
    const earnings = calculateLiveEarnings(salarySettings(), { joiningDate: '2024-01-01' }, new Date(2025, 0, 6, 13));

    expect(earnings).toMatchObject({ dailyRate: 1_000, hourlyRate: 125, earned: 500, progress: 0.5, status: 'earning' });
  });

  it('uses the actual number of days for calendar-month rules', () => {
    expect(calculateDailyRate(salarySettings({ baseSalary: 29_000, salaryCalculationRule: 'calendar-days' }), new Date(2024, 1, 15))).toBe(1_000);
  });

  it('does not emit invalid financial values when legacy settings are malformed', () => {
    const earnings = calculateLiveEarnings(salarySettings({ salaryMode: 'daily-rate', dailyRate: null, shiftDurationHours: 0 }), { joiningDate: '2024-01-01' }, new Date(2025, 0, 6, 13));

    expect(earnings.dailyRate).toBe(0);
    expect(earnings.hourlyRate).toBe(0);
    expect(earnings.earned).toBe(0);
    expect(Number.isFinite(earnings.hourlyRate)).toBe(true);
    expect(() => assertSalaryRules(salarySettings({ shiftDurationHours: 0 }))).toThrow('Shift duration');
  });
});

describe('ledger calculations', () => {
  it('applies company credits and debits using their recorded types', () => {
    expect(getCompanyBalance([
      companyTransaction('credit', 5_000),
      companyTransaction('advance', 1_500),
      companyTransaction('voucher', 500),
    ])).toBe(3_000);
  });

  it('keeps Udhaar and expenses on the debit side of the personal pocket', () => {
    expect(getPocketBalance([
      pocketTransaction('cash-in', 3_000),
      pocketTransaction('udhaar-given', 750),
      pocketTransaction('expense', 250),
      pocketTransaction('receipt', 500),
    ])).toBe(2_500);
  });
});

describe('career calculations', () => {
  it('uses inclusive 30-day pro-rating for individual and lifetime earnings', () => {
    const januaryRole = careerRecord('2025-01-01', '2025-01-30');
    const tenDayRole = careerRecord('2025-02-01', '2025-02-10', 60_000);

    expect(calculateCareerRecordEarnings(januaryRole)).toBe(30_000);
    expect(getCareerLifetimeEarnings([januaryRole, tenDayRole])).toBe(50_000);
    expect(calculateCurrentRoleEarnings('2025-01-01', 30_000, new Date('2025-01-30T12:00:00Z'))).toBe(30_000);
  });
});

describe('local date validation', () => {
  it('rejects calendar overflows before they reach storage', () => {
    expect(isValidLocalDate('2024-02-29')).toBe(true);
    expect(isValidLocalDate('2025-02-29')).toBe(false);
  });
});
