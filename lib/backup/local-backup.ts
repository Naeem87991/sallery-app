import 'client-only';

import { DATABASE_SCHEMA_VERSION, db } from '@/lib/database/database';
import { base64ToBytes, bytesToBase64, toArrayBuffer } from '@/lib/security/pin';
import { assertAppPreferences, assertAttendanceInput, assertCareerRecordInput, assertCompanyTransactionInput, assertPocketTransactionInput, assertProfile, assertSalaryRules, assertSavingsGoalInput } from '@/lib/validation/domain';
import type { AppSettings, AttendanceRecord, CareerRecord, CompanyTransaction, PocketTransaction, SalarySettings, SavingsGoal, UserProfile } from '@/types/domain';

const BACKUP_KIND = 'live-salary-ticker-encrypted-backup';
const BACKUP_FORMAT_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;

type BackupData = {
  profiles: UserProfile[];
  salarySettings: SalarySettings[];
  appSettings: AppSettings[];
  attendanceRecords: AttendanceRecord[];
  companyTransactions: CompanyTransaction[];
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
    pocketTransactionCount: backup.data.pocketTransactions.length,
    savingsGoalCount: backup.data.savingsGoals.length,
    careerRecordCount: backup.data.careerRecords.length,
  };
}

export async function restoreBackup(backup: DecryptedBackup): Promise<void> {
  await db.transaction('rw', [db.profiles, db.salarySettings, db.appSettings, db.attendanceRecords, db.companyTransactions, db.pocketTransactions, db.savingsGoals, db.careerRecords], async () => {
    await Promise.all([
      db.profiles.clear(), db.salarySettings.clear(), db.appSettings.clear(), db.attendanceRecords.clear(), db.companyTransactions.clear(), db.pocketTransactions.clear(), db.savingsGoals.clear(), db.careerRecords.clear(),
    ]);
    await Promise.all([
      db.profiles.bulkPut(backup.data.profiles), db.salarySettings.bulkPut(backup.data.salarySettings), db.appSettings.bulkPut(backup.data.appSettings), db.attendanceRecords.bulkPut(backup.data.attendanceRecords), db.companyTransactions.bulkPut(backup.data.companyTransactions), db.pocketTransactions.bulkPut(backup.data.pocketTransactions), db.savingsGoals.bulkPut(backup.data.savingsGoals), db.careerRecords.bulkPut(backup.data.careerRecords),
    ]);
  });
}

export function validateNewPassphrase(passphrase: string): void {
  if (passphrase.length < 8) throw new Error('Use a backup passphrase with at least 8 characters.');
}

async function readBackupData(): Promise<BackupData> {
  const [profiles, salarySettings, appSettings, attendanceRecords, companyTransactions, pocketTransactions, savingsGoals, careerRecords] = await Promise.all([
    db.profiles.toArray(), db.salarySettings.toArray(), db.appSettings.toArray(), db.attendanceRecords.toArray(), db.companyTransactions.toArray(), db.pocketTransactions.toArray(), db.savingsGoals.toArray(), db.careerRecords.toArray(),
  ]);
  return { profiles, salarySettings, appSettings, attendanceRecords, companyTransactions, pocketTransactions, savingsGoals, careerRecords };
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
  if (record.databaseSchemaVersion > DATABASE_SCHEMA_VERSION) throw new Error('This backup was created by a newer app version and cannot be restored safely here.');
  const data = asRecord(record.data, 'The backup has no data section.');
  const backup: DecryptedBackup = {
    kind: 'live-salary-ticker-backup', formatVersion: 1, createdAt: record.createdAt, databaseSchemaVersion: record.databaseSchemaVersion,
    data: {
      profiles: validateArray(data.profiles, validateUserProfile), salarySettings: validateArray(data.salarySettings, validateSalarySettings), appSettings: validateArray(data.appSettings, validateAppSettings), attendanceRecords: validateArray(data.attendanceRecords, validateAttendanceRecord), companyTransactions: validateArray(data.companyTransactions, validateCompanyTransaction), pocketTransactions: validateArray(data.pocketTransactions, validatePocketTransaction), savingsGoals: validateArray(data.savingsGoals, validateSavingsGoal), careerRecords: validateArray(data.careerRecords, validateCareerRecord),
    },
  };
  Object.values(backup.data).forEach(assertUniqueIds);
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
  const salarySettings = { ...baseCurrentRecord(record, 'salary settings'), salaryMode: record.salaryMode, baseSalary: record.baseSalary, dailyRate: record.dailyRate, salaryCalculationRule: record.salaryCalculationRule, dutyStart: record.dutyStart, dutyEnd: record.dutyEnd, shiftDurationHours: record.shiftDurationHours, weeklyOffDay: record.weeklyOffDay, isWeeklyOffPaid: record.isWeeklyOffPaid, autoAttendanceRule: record.autoAttendanceRule, autoAttendanceTime: record.autoAttendanceTime, halfDayFactor: record.halfDayFactor, currency: 'PKR' };
  assertSalaryRules(salarySettings);
  return salarySettings;
}

function validateAppSettings(input: unknown): AppSettings {
  const record = validateAudited(input, 'app settings');
  if (!isOneOf(record.theme, ['dark', 'light']) || !isOneOf(record.language, ['en', 'ur']) || !isBoolean(record.isPrivacyModeEnabled)) throw new Error('The backup display settings are invalid.');
  const appSettings = { ...baseCurrentRecord(record, 'app settings'), theme: record.theme, language: record.language, isPrivacyModeEnabled: record.isPrivacyModeEnabled };
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
  if (!isString(record.id) || !isOneOf(record.type, ['credit', 'withdrawal', 'voucher', 'advance', 'loan', 'deduction']) || !isFiniteNumber(record.amount) || !isString(record.occurredOn) || !isString(record.note)) throw new Error('A company transaction is invalid.');
  const companyTransaction = { id: record.id, type: record.type, amount: record.amount, occurredOn: record.occurredOn, note: record.note, createdAt: record.createdAt, updatedAt: record.updatedAt };
  assertCompanyTransactionInput(companyTransaction);
  return companyTransaction;
}

function validatePocketTransaction(input: unknown): PocketTransaction {
  const record = validateAudited(input, 'pocket transaction');
  if (!isString(record.id) || !isOneOf(record.type, ['cash-in', 'expense', 'receipt', 'udhaar-given', 'udhaar-received']) || !isFiniteNumber(record.amount) || !isString(record.occurredOn) || !isString(record.note)) throw new Error('A pocket transaction is invalid.');
  const pocketTransaction = { id: record.id, type: record.type, amount: record.amount, occurredOn: record.occurredOn, note: record.note, createdAt: record.createdAt, updatedAt: record.updatedAt };
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
