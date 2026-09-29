export const CURRENT_RECORD_ID = 'current' as const;

export type SalaryMode = 'fixed-monthly' | 'daily-rate';
export type SalaryCalculationRule = '30-days' | '26-working-days' | 'calendar-days';
export type AutoAttendanceRule = 'off' | 'midnight' | 'shift-end' | 'custom-time';
export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'en' | 'ur';
export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off';
export type CompanyTransactionType = 'credit' | 'withdrawal' | 'voucher' | 'advance' | 'loan' | 'loan-repayment' | 'deduction';
export type PocketTransactionType = 'cash-in' | 'expense' | 'receipt' | 'udhaar-given' | 'udhaar-received' | 'savings-transfer-out' | 'savings-transfer-in';
export type PocketCategory = 'income' | 'food' | 'transport' | 'bills' | 'shopping' | 'health' | 'education' | 'family' | 'entertainment' | 'other';

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
  lowCashThreshold: number;
}

export interface SecuritySettings extends AuditedRecord {
  id: typeof CURRENT_RECORD_ID;
  isPinEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  passkeyCredentialId: string | null;
}

export interface AttendanceRecord extends AuditedRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  overtimeMinutes: number;
  note: string;
}

export interface CompanyTransaction extends AuditedRecord {
  id: string;
  type: CompanyTransactionType;
  amount: number;
  occurredOn: string;
  note: string;
  loanId: string | null;
}

export interface CompanyLoan extends AuditedRecord {
  id: string;
  name: string;
  principalAmount: number;
  issuedOn: string;
  note: string;
}

export interface PocketTransaction extends AuditedRecord {
  id: string;
  type: PocketTransactionType;
  amount: number;
  occurredOn: string;
  note: string;
  category: PocketCategory;
  receiptDataUrl: string | null;
  savingsGoalId: string | null;
  reminderOn: string | null;
}

export interface SavingsGoal extends AuditedRecord {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  note: string;
}

export interface CareerRecord extends AuditedRecord {
  id: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
  monthlySalary: number;
  note: string;
}

export interface OnboardingPayload {
  profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
  salarySettings: Omit<SalarySettings, 'id' | 'createdAt' | 'updatedAt'>;
  appSettings: Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>;
}
