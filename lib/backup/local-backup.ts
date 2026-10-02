import 'client-only';

import { DATABASE_SCHEMA_VERSION } from '@/lib/database/database';
import { readSupabaseBackupData } from '@/lib/backup/supabase-backup';
import { createClient } from '@/lib/supabase/client';
import { base64ToBytes, bytesToBase64, toArrayBuffer } from '@/lib/security/pin';
import { assertAppPreferences, assertAttendanceInput, assertCareerRecordInput, assertCompanyLoanInput, assertCompanyTransactionInput, assertPocketTransactionInput, assertProfile, assertSalaryRules, assertSavingsGoalInput } from '@/lib/validation/domain';
import type { AppSettings, AttendanceRecord, CareerRecord, CompanyLoan, CompanyTransaction, PocketCategory, PocketTransaction, SalarySettings, SavingsGoal, UserProfile } from '@/types/domain';

const BACKUP_KIND = 'live-salary-ticker-encrypted-backup';
const BACKUP_FORMAT_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;

type BackupData = {
  profiles: UserProfile[];
  salarySettings: SalarySettings[];
  appSettings: AppSettings[];
  attendanceRecords: AttendanceRecord[];
  companyTransactions: CompanyTransaction[];
  companyLoans: CompanyLoan[];
  pocketTransactions: PocketTransaction[];
  savingsGoals: SavingsGoal[];
  careerRecords: CareerRecord[];
};

export type DecryptedBackup = {
  kind: 'live-salary-ticker-backup';
  formatVersion: 1;
  createdAt: string;
  databaseSchemaVersion: number;
  data: BackupData;
};

type EncryptedBackupEnvelope = {
  kind: typeof BACKUP_KIND;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  createdAt: string;
  encryption: {
    algorithm: 'AES-GCM';
    kdf: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string;
    iv: string;
  };
  ciphertext: string;
};

export type BackupSummary = {
  createdAt: string;
  databaseSchemaVersion: number;
  profileCount: number;
  attendanceCount: number;
  companyTransactionCount: number;
  companyLoanCount: number;
  pocketTransactionCount: number;
  savingsGoalCount: number;
  careerRecordCount: number;
};

export async function createEncryptedBackup(passphrase: string): Promise<Blob> {
  validateNewPassphrase(passphrase);
  const data = await readBackupData();
  const payload: DecryptedBackup = { kind: 'live-salary-ticker-backup', formatVersion: 1, createdAt: new Date().toISOString(), databaseSchemaVersion: DATABASE_SCHEMA_VERSION, data };
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveBackupKey(passphrase, salt, PBKDF2_ITERATIONS);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(new TextEncoder().encode(JSON.stringify(payload))));
  const envelope: EncryptedBackupEnvelope = {
    kind: BACKUP_KIND,
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: payload.createdAt,
    encryption: { algorithm: 'AES-GCM', kdf: 'PBKDF2', hash: 'SHA-256', iterations: PBKDF2_ITERATIONS, salt: bytesToBase64(salt), iv: bytesToBase64(iv) },
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
  return new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
}

export async function decryptBackupFile(file: File, passphrase: string): Promise<DecryptedBackup> {
  const raw = await file.text();
  return decryptBackupText(raw, passphrase);
}

export async function decryptBackupText(raw: string, passphrase: string): Promise<DecryptedBackup> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('This file is not valid backup JSON.'); }
  const envelope = validateEnvelope(parsed);
  try {
    const key = await deriveBackupKey(passphrase, base64ToBytes(envelope.encryption.salt), envelope.encryption.iterations);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(envelope.encryption.iv)) }, key, toArrayBuffer(base64ToBytes(envelope.ciphertext)));
    return validateBackupPayload(JSON.parse(new TextDecoder().decode(decrypted)));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The decrypted backup data is invalid.');
    throw new Error('Could not unlock this backup. Check the passphrase and file.');
  }
}

export function getBackupSummary(backup: DecryptedBackup): BackupSummary {
  return {
    createdAt: backup.createdAt,
    databaseSchemaVersion: backup.databaseSchemaVersion,
    profileCount: backup.data.profiles.length,
    attendanceCount: backup.data.attendanceRecords.length,
    companyTransactionCount: backup.data.companyTransactions.length,
    companyLoanCount: backup.data.companyLoans.length,
    pocketTransactionCount: backup.data.pocketTransactions.length,
    savingsGoalCount: backup.data.savingsGoals.length,
    careerRecordCount: backup.data.careerRecords.length,
  };
}

export async function restoreBackup(backup: DecryptedBackup): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('You must be signed in to restore a backup.');
  const uid = user.id;

  // Delete all existing data for this user first
  await Promise.all([
    sb.from('attendance_records').delete().eq('user_id', uid),
    sb.from('company_transactions').delete().eq('user_id', uid),
    sb.from('company_loans').delete().eq('user_id', uid),
    sb.from('pocket_transactions').delete().eq('user_id', uid),
    sb.from('savings_goals').delete().eq('user_id', uid),
    sb.from('career_records').delete().eq('user_id', uid),
  ]);

  // Upsert profile (merged UserProfile + SalarySettings)
  if (backup.data.profiles.length && backup.data.salarySettings.length) {
    const p = backup.data.profiles[0];
    const s = backup.data.salarySettings[0];
    await sb.from('profiles').upsert({
      user_id: uid,
      first_name: p.firstName, last_name: p.lastName,
      employee_id: p.employeeId, designation: p.designation,
      joining_date: p.joiningDate,
      salary_mode: s.salaryMode, base_salary: s.baseSalary,
      daily_rate: s.dailyRate, salary_calculation_rule: s.salaryCalculationRule,
      duty_start: s.dutyStart, duty_end: s.dutyEnd,
      shift_duration_hours: s.shiftDurationHours, weekly_off_day: s.weeklyOffDay,
      is_weekly_off_paid: s.isWeeklyOffPaid, auto_attendance_rule: s.autoAttendanceRule,
      auto_attendance_time: s.autoAttendanceTime, half_day_factor: s.halfDayFactor,
      currency: 'PKR',
    }, { onConflict: 'user_id' });
  }

  // Upsert app settings
  if (backup.data.appSettings.length) {
    const a = backup.data.appSettings[0];
    await sb.from('app_settings').upsert({
      user_id: uid, theme: a.theme, language: a.language,
      is_privacy_mode_enabled: a.isPrivacyModeEnabled,
      low_cash_threshold: a.lowCashThreshold,
    }, { onConflict: 'user_id' });
  }

  // Insert attendance
  if (backup.data.attendanceRecords.length) {
    await sb.from('attendance_records').insert(
      backup.data.attendanceRecords.map((r) => ({
        user_id: uid, date: r.date, status: r.status,
        check_in: r.checkIn, check_out: r.checkOut,
        overtime_minutes: r.overtimeMinutes, note: r.note,
      }))
    );
  }

  // Insert company loans first (transactions reference them)
  if (backup.data.companyLoans.length) {
    await sb.from('company_loans').insert(
      backup.data.companyLoans.map((r) => ({
        id: r.id, user_id: uid, name: r.name,
        principal_amount: r.principalAmount, issued_on: r.issuedOn, note: r.note,
      }))
    );
  }

  // Insert company transactions
  if (backup.data.companyTransactions.length) {
    await sb.from('company_transactions').insert(
      backup.data.companyTransactions.map((r) => ({
        id: r.id, user_id: uid, type: r.type, amount: r.amount,
        occurred_on: r.occurredOn, note: r.note, loan_id: r.loanId,
      }))
    );
  }

  // Insert savings goals first (pocket transactions reference them)
  if (backup.data.savingsGoals.length) {
    await sb.from('savings_goals').insert(
      backup.data.savingsGoals.map((r) => ({
        id: r.id, user_id: uid, name: r.name,
        target_amount: r.targetAmount, saved_amount: r.savedAmount,
        target_date: r.targetDate, note: r.note,
      }))
    );
  }

  // Insert pocket transactions
  if (backup.data.pocketTransactions.length) {
    await sb.from('pocket_transactions').insert(
      backup.data.pocketTransactions.map((r) => ({
        id: r.id, user_id: uid, type: r.type, amount: r.amount,
        occurred_on: r.occurredOn, note: r.note, category: r.category,
        receipt_data_url: r.receiptDataUrl, savings_goal_id: r.savingsGoalId,
        reminder_on: r.reminderOn,
      }))
    );
  }

  // Insert career records
  if (backup.data.careerRecords.length) {
    await sb.from('career_records').insert(
      backup.data.careerRecords.map((r) => ({
        id: r.id, user_id: uid, company_name: r.companyName,
        designation: r.designation, start_date: r.startDate,
        end_date: r.endDate, monthly_salary: r.monthlySalary, note: r.note,
      }))
    );
  }
}

export function validateNewPassphrase(passphrase: string): void {
  if (passphrase.length < 8) throw new Error('Use a backup passphrase with at least 8 characters.');
}

async function readBackupData(): Promise<BackupData> {
  return readSupabaseBackupData();
}

async function deriveBackupKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: toArrayBuffer(salt), iterations, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function validateEnvelope(input: unknown): EncryptedBackupEnvelope {
  const record = asRecord(input, 'This file does not contain a supported backup.');
  const encryption = asRecord(record.encryption, 'This backup has no encryption metadata.');
  if (record.kind !== BACKUP_KIND || record.formatVersion !== BACKUP_FORMAT_VERSION || encryption.algorithm !== 'AES-GCM' || encryption.kdf !== 'PBKDF2' || encryption.hash !== 'SHA-256') throw new Error('This backup format is not supported.');
  if (!isString(record.createdAt) || !isString(record.ciphertext) || !isString(encryption.salt) || !isString(encryption.iv) || !isSafeIterationCount(encryption.iterations)) throw new Error('This backup encryption metadata is invalid.');
  return { kind: BACKUP_KIND, formatVersion: BACKUP_FORMAT_VERSION, createdAt: record.createdAt, encryption: { algorithm: 'AES-GCM', kdf: 'PBKDF2', hash: 'SHA-256', iterations: encryption.iterations, salt: encryption.salt, iv: encryption.iv }, ciphertext: record.ciphertext };
}

function validateBackupPayload(input: unknown): DecryptedBackup {
  const record = asRecord(input, 'The decrypted content is not a Live Salary Ticker backup.');
  if (record.kind !== 'live-salary-ticker-backup' || record.formatVersion !== 1 || !isString(record.createdAt) || !isFiniteNumber(record.databaseSchemaVersion) || record.databaseSchemaVersion < 1) throw new Error('The backup schema is invalid.');
  const databaseSchemaVersion = record.databaseSchemaVersion;
  if (databaseSchemaVersion > DATABASE_SCHEMA_VERSION) throw new Error('This backup was created by a newer app version and cannot be restored safely here.');
  const data = asRecord(record.data, 'The backup has no data section.');
  const backup: DecryptedBackup = {
    kind: 'live-salary-ticker-backup', formatVersion: 1, createdAt: record.createdAt, databaseSchemaVersion,
    data: {
      profiles: validateArray(data.profiles, validateUserProfile), salarySettings: validateArray(data.salarySettings, validateSalarySettings), appSettings: validateArray(data.appSettings, (value) => validateAppSettings(value, databaseSchemaVersion < 7)), attendanceRecords: validateArray(data.attendanceRecords, validateAttendanceRecord), companyTransactions: validateArray(data.companyTransactions, validateCompanyTransaction), companyLoans: data.companyLoans === undefined && databaseSchemaVersion < 5 ? [] : validateArray(data.companyLoans, validateCompanyLoan), pocketTransactions: validateArray(data.pocketTransactions, (value) => validatePocketTransaction(value, databaseSchemaVersion < 7)), savingsGoals: validateArray(data.savingsGoals, validateSavingsGoal), careerRecords: validateArray(data.careerRecords, validateCareerRecord),
    },
  };
  Object.values(backup.data).forEach(assertUniqueIds);
  const companyLoanIds = new Set(backup.data.companyLoans.map((loan) => loan.id));
  const savingsGoalIds = new Set(backup.data.savingsGoals.map((goal) => goal.id));
  if (backup.data.companyTransactions.some((transaction) => transaction.type === 'loan-repayment' && (!transaction.loanId || !companyLoanIds.has(transaction.loanId)))) throw new Error('A loan repayment does not reference a saved loan.');
  if (backup.data.pocketTransactions.some((transaction) => transaction.savingsGoalId && !savingsGoalIds.has(transaction.savingsGoalId))) throw new Error('A savings transfer does not reference a saved goal.');
  return backup;
}

function validateUserProfile(input: unknown): UserProfile {
  const record = validateAudited(input, 'profile');
  const profile = { ...baseCurrentRecord(record, 'profile'), firstName: requiredString(record.firstName, 'profile first name'), lastName: requiredString(record.lastName, 'profile last name'), employeeId: requiredString(record.employeeId, 'profile employee ID'), designation: requiredString(record.designation, 'profile designation'), joiningDate: requiredString(record.joiningDate, 'profile joining date') };
  assertProfile(profile);
  return profile;
}

function validateSalarySettings(input: unknown): SalarySettings {
  const record = validateAudited(input, 'salary settings');
  if (!isOneOf(record.salaryMode, ['fixed-monthly', 'daily-rate']) || !isOneOf(record.salaryCalculationRule, ['30-days', '26-working-days', 'calendar-days']) || !isOneOf(record.autoAttendanceRule, ['off', 'midnight', 'shift-end', 'custom-time']) || record.currency !== 'PKR') throw new Error('The backup salary settings are invalid.');
  if (!isFiniteNumber(record.baseSalary) || !isNullableFiniteNumber(record.dailyRate) || !isString(record.dutyStart) || !isString(record.dutyEnd) || !isFiniteNumber(record.shiftDurationHours) || !isFiniteNumber(record.weeklyOffDay) || !isBoolean(record.isWeeklyOffPaid) || !isNullableString(record.autoAttendanceTime) || !isFiniteNumber(record.halfDayFactor)) throw new Error('The backup salary values are invalid.');
  const salarySettings: SalarySettings = { ...baseCurrentRecord(record, 'salary settings'), salaryMode: record.salaryMode, baseSalary: record.baseSalary, dailyRate: record.dailyRate, salaryCalculationRule: record.salaryCalculationRule, dutyStart: record.dutyStart, dutyEnd: record.dutyEnd, shiftDurationHours: record.shiftDurationHours, weeklyOffDay: record.weeklyOffDay, isWeeklyOffPaid: record.isWeeklyOffPaid, autoAttendanceRule: record.autoAttendanceRule, autoAttendanceTime: record.autoAttendanceTime, halfDayFactor: record.halfDayFactor, currency: 'PKR' };
  assertSalaryRules(salarySettings);
  return salarySettings;
}

function validateAppSettings(input: unknown, allowLegacyFields: boolean): AppSettings {
  const record = validateAudited(input, 'app settings');
  if (!isOneOf(record.theme, ['dark', 'light']) || !isOneOf(record.language, ['en', 'ur']) || !isBoolean(record.isPrivacyModeEnabled) || (!allowLegacyFields && (!isFiniteNumber(record.lowCashThreshold) || record.lowCashThreshold < 0)) || (allowLegacyFields && record.lowCashThreshold !== undefined && (!isFiniteNumber(record.lowCashThreshold) || record.lowCashThreshold < 0))) throw new Error('The backup display settings are invalid.');
  const appSettings = { ...baseCurrentRecord(record, 'app settings'), theme: record.theme, language: record.language, isPrivacyModeEnabled: record.isPrivacyModeEnabled, lowCashThreshold: isFiniteNumber(record.lowCashThreshold) ? record.lowCashThreshold : 0 };
  assertAppPreferences(appSettings);
  return appSettings;
}

function validateAttendanceRecord(input: unknown): AttendanceRecord {
  const record = validateAudited(input, 'attendance record');
  if (!isString(record.id) || !isString(record.date) || !isOneOf(record.status, ['present', 'absent', 'half-day', 'leave', 'weekly-off']) || !isNullableString(record.checkIn) || !isNullableString(record.checkOut) || !isFiniteNumber(record.overtimeMinutes) || !isString(record.note)) throw new Error('An attendance record is invalid.');
  const attendanceRecord = { id: record.id, date: record.date, status: record.status, checkIn: record.checkIn, checkOut: record.checkOut, overtimeMinutes: record.overtimeMinutes, note: record.note, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertAttendanceInput(attendanceRecord);
  return attendanceRecord;
}

function validateCompanyTransaction(input: unknown): CompanyTransaction {
  const record = validateAudited(input, 'company transaction');
  if (!isString(record.id) || !isOneOf(record.type, ['credit', 'withdrawal', 'voucher', 'advance', 'loan', 'loan-repayment', 'deduction']) || !isFiniteNumber(record.amount) || !isString(record.occurredOn) || !isString(record.note) || (record.loanId !== undefined && !isNullableString(record.loanId))) throw new Error('A company transaction is invalid.');
  const companyTransaction = { id: record.id, type: record.type, amount: record.amount, occurredOn: record.occurredOn, note: record.note, loanId: isString(record.loanId) ? record.loanId : null, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertCompanyTransactionInput(companyTransaction);
  return companyTransaction;
}

function validateCompanyLoan(input: unknown): CompanyLoan {
  const record = validateAudited(input, 'company loan');
  if (!isString(record.id) || !isString(record.name) || !isFiniteNumber(record.principalAmount) || !isString(record.issuedOn) || !isString(record.note)) throw new Error('A company loan is invalid.');
  const loan = { id: record.id, name: record.name, principalAmount: record.principalAmount, issuedOn: record.issuedOn, note: record.note, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertCompanyLoanInput(loan);
  return loan;
}

function validatePocketTransaction(input: unknown, allowLegacyFields: boolean): PocketTransaction {
  const record = validateAudited(input, 'pocket transaction');
  const hasValidNewFields = isNullableString(record.savingsGoalId) && isNullableString(record.reminderOn);
  if (!isString(record.id) || !isOneOf(record.type, ['cash-in', 'expense', 'receipt', 'udhaar-given', 'udhaar-received', 'savings-transfer-out', 'savings-transfer-in']) || !isFiniteNumber(record.amount) || !isString(record.occurredOn) || !isString(record.note) || (!allowLegacyFields && (!isOneOf(record.category, ['income', 'food', 'transport', 'bills', 'shopping', 'health', 'education', 'family', 'entertainment', 'other']) || !isNullableString(record.receiptDataUrl) || !hasValidNewFields)) || (allowLegacyFields && ((record.category !== undefined && !isOneOf(record.category, ['income', 'food', 'transport', 'bills', 'shopping', 'health', 'education', 'family', 'entertainment', 'other'])) || (record.receiptDataUrl !== undefined && !isNullableString(record.receiptDataUrl)) || (record.savingsGoalId !== undefined && !isNullableString(record.savingsGoalId)) || (record.reminderOn !== undefined && !isNullableString(record.reminderOn))))) throw new Error('A pocket transaction is invalid.');
  const pocketTransaction = { id: record.id, type: record.type, amount: record.amount, occurredOn: record.occurredOn, note: record.note, category: (isOneOf(record.category, ['income', 'food', 'transport', 'bills', 'shopping', 'health', 'education', 'family', 'entertainment', 'other']) ? record.category : 'other') as PocketCategory, receiptDataUrl: isString(record.receiptDataUrl) ? record.receiptDataUrl : null, savingsGoalId: isString(record.savingsGoalId) ? record.savingsGoalId : null, reminderOn: isString(record.reminderOn) ? record.reminderOn : null, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertPocketTransactionInput(pocketTransaction);
  return pocketTransaction;
}

function validateSavingsGoal(input: unknown): SavingsGoal {
  const record = validateAudited(input, 'savings goal');
  if (!isString(record.id) || !isString(record.name) || !isFiniteNumber(record.targetAmount) || !isFiniteNumber(record.savedAmount) || !isNullableString(record.targetDate) || !isString(record.note)) throw new Error('A savings goal is invalid.');
  const savingsGoal = { id: record.id, name: record.name, targetAmount: record.targetAmount, savedAmount: record.savedAmount, targetDate: record.targetDate, note: record.note, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertSavingsGoalInput(savingsGoal);
  return savingsGoal;
}

function validateCareerRecord(input: unknown): CareerRecord {
  const record = validateAudited(input, 'career record');
  if (!isString(record.id) || !isString(record.companyName) || !isString(record.designation) || !isString(record.startDate) || !isString(record.endDate) || !isFiniteNumber(record.monthlySalary) || !isString(record.note)) throw new Error('A career record is invalid.');
  const careerRecord = { id: record.id, companyName: record.companyName, designation: record.designation, startDate: record.startDate, endDate: record.endDate, monthlySalary: record.monthlySalary, note: record.note, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertCareerRecordInput(careerRecord);
  return careerRecord;
}

function validateAudited(input: unknown, label: string): Record<string, unknown> & { createdAt: string; updatedAt: string } {
  const record = asRecord(input, `A ${label} is invalid.`);
  if (!isString(record.createdAt) || !isString(record.updatedAt)) throw new Error(`A ${label} has invalid audit dates.`);
  return { ...record, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

function baseCurrentRecord(record: Record<string, unknown> & { createdAt: string; updatedAt: string }, label: string): Pick<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  if (record.id !== 'current') throw new Error(`The ${label} must use the current record ID.`);
  return { id: 'current', createdAt: record.createdAt, updatedAt: record.updatedAt };
}

function validateArray<T>(input: unknown, validate: (value: unknown) => T): T[] {
  if (!Array.isArray(input)) throw new Error('The backup has an invalid record collection.');
  return input.map(validate);
}

function assertUniqueIds(records: Array<{ id: string }>): void {
  if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error('The backup contains duplicate record IDs.');
}

function asRecord(input: unknown, message: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(message);
  return input as Record<string, unknown>;
}

function requiredString(input: unknown, label: string): string {
  if (!isString(input)) throw new Error(`The ${label} is invalid.`);
  return input;
}

function isString(input: unknown): input is string { return typeof input === 'string'; }
function isNullableString(input: unknown): input is string | null { return input === null || isString(input); }
function isBoolean(input: unknown): input is boolean { return typeof input === 'boolean'; }
function isFiniteNumber(input: unknown): input is number { return typeof input === 'number' && Number.isFinite(input); }
function isNullableFiniteNumber(input: unknown): input is number | null { return input === null || isFiniteNumber(input); }
function isSafeIterationCount(input: unknown): input is number { return typeof input === 'number' && Number.isInteger(input) && input >= 100_000 && input <= 1_000_000; }
function isOneOf<T extends string>(input: unknown, values: readonly T[]): input is T { return typeof input === 'string' && values.includes(input as T); }
