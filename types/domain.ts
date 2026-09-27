export const CURRENT_RECORD_ID = 'current' as const;

export type SalaryMode = 'fixed-monthly' | 'daily-rate';
export type SalaryCalculationRule = '30-days' | '26-working-days' | 'calendar-days';
export type AutoAttendanceRule = 'off' | 'midnight' | 'shift-end' | 'custom-time';
export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'en' | 'ur';

export interface AuditedRecord {
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends AuditedRecord {
  id: typeof CURRENT_RECORD_ID;
  firstName: string;
  lastName: string;
  employeeId: string;
  designation: string;
  joiningDate: string;
}

export interface SalarySettings extends AuditedRecord {
  id: typeof CURRENT_RECORD_ID;
  salaryMode: SalaryMode;
  baseSalary: number;
  dailyRate: number | null;
  salaryCalculationRule: SalaryCalculationRule;
  dutyStart: string;
  dutyEnd: string;
  shiftDurationHours: number;
  weeklyOffDay: number;
  isWeeklyOffPaid: boolean;
  autoAttendanceRule: AutoAttendanceRule;
  autoAttendanceTime: string | null;
  halfDayFactor: number;
  currency: 'PKR';
}

export interface AppSettings extends AuditedRecord {
  id: typeof CURRENT_RECORD_ID;
  theme: AppTheme;
  language: AppLanguage;
  isPrivacyModeEnabled: boolean;
}

export interface OnboardingPayload {
  profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
  salarySettings: Omit<SalarySettings, 'id' | 'createdAt' | 'updatedAt'>;
  appSettings: Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>;
}
