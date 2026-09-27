import { db } from '@/lib/database/database';
import {
  CURRENT_RECORD_ID,
  type AppSettings,
  type AttendanceRecord,
  type AttendanceStatus,
  type CompanyTransactionType,
  type OnboardingPayload,
  type SalarySettings,
  type UserProfile,
} from '@/types/domain';

export const defaultSalarySettings: Omit<SalarySettings, 'id' | 'createdAt' | 'updatedAt'> = {
  salaryMode: 'fixed-monthly',
  baseSalary: 30000,
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
};

export const defaultAppSettings: Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  theme: 'dark',
  language: 'en',
  isPrivacyModeEnabled: false,
};

export async function saveOnboarding(payload: OnboardingPayload): Promise<void> {
  const now = new Date().toISOString();
  const [profile, salary, appSettings] = await Promise.all([
    db.profiles.get(CURRENT_RECORD_ID),
    db.salarySettings.get(CURRENT_RECORD_ID),
    db.appSettings.get(CURRENT_RECORD_ID),
  ]);

  await db.transaction('rw', db.profiles, db.salarySettings, db.appSettings, async () => {
    await db.profiles.put({ id: CURRENT_RECORD_ID, ...payload.profile, createdAt: profile?.createdAt ?? now, updatedAt: now });
    await db.salarySettings.put({ id: CURRENT_RECORD_ID, ...payload.salarySettings, createdAt: salary?.createdAt ?? now, updatedAt: now });
    await db.appSettings.put({ id: CURRENT_RECORD_ID, ...payload.appSettings, createdAt: appSettings?.createdAt ?? now, updatedAt: now });
  });
}

export async function updateProfile(profile: UserProfile): Promise<void> {
  await db.profiles.put({ ...profile, updatedAt: new Date().toISOString() });
}

export async function updateSalarySettings(salarySettings: SalarySettings): Promise<void> {
  await db.salarySettings.put({ ...salarySettings, updatedAt: new Date().toISOString() });
}

export async function updateAppSettings(appSettings: AppSettings): Promise<void> {
  await db.appSettings.put({ ...appSettings, updatedAt: new Date().toISOString() });
}

export type AttendanceRecordInput = {
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  overtimeMinutes: number;
  note: string;
};

export async function saveAttendanceRecord(input: AttendanceRecordInput): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.attendanceRecords.get(input.date);
  await db.attendanceRecords.put({
    id: input.date,
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export async function fillWorkdaysForMonth({ month, weeklyOffDay, joiningDate, throughDate }: { month: string; weeklyOffDay: number; joiningDate: string; throughDate: string }): Promise<number> {
  const [year, monthIndex] = month.split('-').map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
  const existing = await db.attendanceRecords.where('date').between(startDate, endDate, true, true).toArray();
  const existingDates = new Set(existing.map((record) => record.date));
  const now = new Date().toISOString();
  const newRecords: AttendanceRecord[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const localDate = new Date(year, monthIndex - 1, day);
    if (date < joiningDate || date > throughDate || localDate.getDay() === weeklyOffDay || existingDates.has(date)) continue;
    newRecords.push({ id: date, date, status: 'present', checkIn: null, checkOut: null, overtimeMinutes: 0, note: '', createdAt: now, updatedAt: now });
  }

  await db.attendanceRecords.bulkPut(newRecords);
  return newRecords.length;
}

export type CompanyTransactionInput = {
  type: CompanyTransactionType;
  amount: number;
  occurredOn: string;
  note: string;
};

export async function addCompanyTransaction(input: CompanyTransactionInput): Promise<void> {
  const now = new Date().toISOString();
  await db.companyTransactions.add({ id: createLocalId(), ...input, createdAt: now, updatedAt: now });
}

export async function deleteCompanyTransaction(id: string): Promise<void> {
  await db.companyTransactions.delete(id);
}

function createLocalId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
