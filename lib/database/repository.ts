import { db } from '@/lib/database/database';
import {
  assertAppPreferences,
  assertAttendanceInput,
  assertCareerRecordInput,
  assertCompanyLoanInput,
  assertCompanyTransactionInput,
  assertOnboardingPayload,
  assertPocketTransactionInput,
  assertProfile,
  assertSalaryRules,
  assertSavingsGoalInput,
  isValidLocalDate,
} from '@/lib/validation/domain';
import {
  CURRENT_RECORD_ID,
  type AppSettings,
  type AttendanceRecord,
  type AttendanceStatus,
  type CareerRecord,
  type CompanyLoan,
  type CompanyTransaction,
  type CompanyTransactionType,
  type OnboardingPayload,
  type PocketTransactionType,
  type PocketCategory,
  type SalarySettings,
  type SavingsGoal,
  type SecuritySettings,
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
  assertOnboardingPayload(payload);
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
  assertProfile(profile);
  await db.profiles.put({ ...profile, updatedAt: new Date().toISOString() });
}

export async function updateSalarySettings(salarySettings: SalarySettings): Promise<void> {
  assertSalaryRules(salarySettings);
  await db.salarySettings.put({ ...salarySettings, updatedAt: new Date().toISOString() });
}

export async function updateAppSettings(appSettings: AppSettings): Promise<void> {
  assertAppPreferences(appSettings);
  await db.appSettings.put({ ...appSettings, updatedAt: new Date().toISOString() });
}

export async function savePinSecurity({ pinHash, pinSalt }: Pick<SecuritySettings, 'pinHash' | 'pinSalt'>): Promise<SecuritySettings> {
  const now = new Date().toISOString();
  const existing = await db.securitySettings.get(CURRENT_RECORD_ID);
  const securitySettings: SecuritySettings = {
    id: CURRENT_RECORD_ID,
    isPinEnabled: true,
    pinHash,
    pinSalt,
    passkeyCredentialId: existing?.passkeyCredentialId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.securitySettings.put(securitySettings);
  return securitySettings;
}

export async function disablePinSecurity(): Promise<SecuritySettings> {
  const now = new Date().toISOString();
  const existing = await db.securitySettings.get(CURRENT_RECORD_ID);
  const securitySettings: SecuritySettings = {
    id: CURRENT_RECORD_ID,
    isPinEnabled: false,
    pinHash: null,
    pinSalt: null,
    passkeyCredentialId: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.securitySettings.put(securitySettings);
  return securitySettings;
}

export async function savePasskeyCredential(passkeyCredentialId: string): Promise<SecuritySettings> {
  const existing = await db.securitySettings.get(CURRENT_RECORD_ID);
  if (!existing?.isPinEnabled) throw new Error('Set a PIN before adding a passkey.');
  const securitySettings = { ...existing, passkeyCredentialId, updatedAt: new Date().toISOString() };
  await db.securitySettings.put(securitySettings);
  return securitySettings;
}

export async function removePasskeyCredential(): Promise<SecuritySettings> {
  const existing = await db.securitySettings.get(CURRENT_RECORD_ID);
  if (!existing) throw new Error('Security settings are not available.');
  const securitySettings = { ...existing, passkeyCredentialId: null, updatedAt: new Date().toISOString() };
  await db.securitySettings.put(securitySettings);
  return securitySettings;
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
  assertAttendanceInput(input);
  const now = new Date().toISOString();
  const existing = await db.attendanceRecords.get(input.date);
  await db.attendanceRecords.put({
    id: input.date,
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export type AutomaticAttendanceRecordInput = Pick<AttendanceRecord, 'date' | 'status' | 'note'>;

export async function saveAutomaticAttendanceIfMissing(input: AutomaticAttendanceRecordInput): Promise<boolean> {
  const recordInput: AttendanceRecordInput = { ...input, checkIn: null, checkOut: null, overtimeMinutes: 0 };
  assertAttendanceInput(recordInput);

  return db.transaction('rw', db.attendanceRecords, async () => {
    const existing = await db.attendanceRecords.get(input.date);
    if (existing) return false;

    const now = new Date().toISOString();
    await db.attendanceRecords.add({ id: input.date, ...recordInput, createdAt: now, updatedAt: now });
    return true;
  });
}

export async function fillWorkdaysForMonth({ month, weeklyOffDay, joiningDate, throughDate }: { month: string; weeklyOffDay: number; joiningDate: string; throughDate: string }): Promise<number> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(weeklyOffDay) || weeklyOffDay < 0 || weeklyOffDay > 6 || !isValidLocalDate(joiningDate) || !isValidLocalDate(throughDate)) throw new Error('Attendance fill settings are invalid.');
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
  assertCompanyTransactionInput(input);
  const now = new Date().toISOString();
  await db.companyTransactions.add({ id: createLocalId(), ...input, loanId: null, createdAt: now, updatedAt: now });
}

export async function deleteCompanyTransaction(id: string): Promise<void> {
  await db.transaction('rw', db.companyTransactions, db.companyLoans, async () => {
    const transaction = await db.companyTransactions.get(id);
    if (!transaction) return;
    if (transaction.type === 'loan' && transaction.loanId) {
      await db.companyTransactions.where('loanId').equals(transaction.loanId).delete();
      await db.companyLoans.delete(transaction.loanId);
      return;
    }
    await db.companyTransactions.delete(id);
  });
}

export type CompanyLoanInput = Pick<CompanyLoan, 'name' | 'principalAmount' | 'issuedOn' | 'note'>;

export async function addCompanyLoan(input: CompanyLoanInput): Promise<void> {
  assertCompanyLoanInput(input);
  const now = new Date().toISOString();
  const loanId = createLocalId();
  await db.transaction('rw', db.companyLoans, db.companyTransactions, async () => {
    await db.companyLoans.add({ id: loanId, ...input, createdAt: now, updatedAt: now });
    await db.companyTransactions.add({ id: createLocalId(), type: 'loan', amount: input.principalAmount, occurredOn: input.issuedOn, note: input.note || input.name, loanId, createdAt: now, updatedAt: now });
  });
}

export type CompanyLoanRepaymentInput = Pick<CompanyTransaction, 'loanId' | 'amount' | 'occurredOn' | 'note'>;

export async function addCompanyLoanRepayment(input: CompanyLoanRepaymentInput): Promise<void> {
  const loanId = input.loanId;
  if (!loanId) throw new Error('Choose a loan to repay.');
  assertCompanyTransactionInput({ type: 'loan-repayment', amount: input.amount, occurredOn: input.occurredOn, note: input.note });
  await db.transaction('rw', db.companyLoans, db.companyTransactions, async () => {
    const loan = await db.companyLoans.get(loanId);
    if (!loan) throw new Error('This loan no longer exists.');
    const repayments = await db.companyTransactions.where('loanId').equals(loanId).and((transaction) => transaction.type === 'loan-repayment').toArray();
    const repaidAmount = repayments.reduce((total, repayment) => total + repayment.amount, 0);
    if (input.amount > loan.principalAmount - repaidAmount) throw new Error('Repayment cannot exceed the outstanding loan amount.');
    const now = new Date().toISOString();
    await db.companyTransactions.add({ id: createLocalId(), type: 'loan-repayment', ...input, loanId, note: input.note.trim() || `Repayment for ${loan.name}`, createdAt: now, updatedAt: now });
  });
}

export type PocketTransactionInput = {
  type: PocketTransactionType;
  amount: number;
  occurredOn: string;
  note: string;
  category: PocketCategory;
  receiptDataUrl: string | null;
};

export async function addPocketTransaction(input: PocketTransactionInput): Promise<void> {
  assertPocketTransactionInput(input);
  const now = new Date().toISOString();
  await db.pocketTransactions.add({ id: createLocalId(), ...input, createdAt: now, updatedAt: now });
}

export async function deletePocketTransaction(id: string): Promise<void> {
  await db.pocketTransactions.delete(id);
}

export type SavingsGoalInput = Pick<SavingsGoal, 'name' | 'targetAmount' | 'savedAmount' | 'targetDate' | 'note'>;

export async function addSavingsGoal(input: SavingsGoalInput): Promise<void> {
  assertSavingsGoalInput(input);
  const now = new Date().toISOString();
  await db.savingsGoals.add({ id: createLocalId(), ...input, createdAt: now, updatedAt: now });
}

export async function updateSavingsGoal(goal: SavingsGoal): Promise<void> {
  assertSavingsGoalInput(goal);
  await db.savingsGoals.put({ ...goal, updatedAt: new Date().toISOString() });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await db.savingsGoals.delete(id);
}

export type CareerRecordInput = Pick<CareerRecord, 'companyName' | 'designation' | 'startDate' | 'endDate' | 'monthlySalary' | 'note'>;

export async function addCareerRecord(input: CareerRecordInput): Promise<void> {
  assertCareerRecordInput(input);
  const now = new Date().toISOString();
  await db.careerRecords.add({ id: createLocalId(), ...input, createdAt: now, updatedAt: now });
}

export async function deleteCareerRecord(id: string): Promise<void> {
  await db.careerRecords.delete(id);
}

function createLocalId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
