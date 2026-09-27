import { db } from '@/lib/database/database';
import { CURRENT_RECORD_ID, type AppSettings, type OnboardingPayload, type SalarySettings, type UserProfile } from '@/types/domain';

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
