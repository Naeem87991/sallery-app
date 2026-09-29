import type { AppSettings, AttendanceRecord, AttendanceStatus, CareerRecord, CompanyLoan, CompanyTransactionType, OnboardingPayload, PocketCategory, PocketTransactionType, SalarySettings, SavingsGoal, UserProfile } from '@/types/domain';

const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localTimePattern = /^(\d{2}):(\d{2})$/;
const attendanceStatuses: AttendanceStatus[] = ['present', 'absent', 'half-day', 'leave', 'weekly-off'];
const companyTransactionTypes: CompanyTransactionType[] = ['credit', 'withdrawal', 'voucher', 'advance', 'loan', 'loan-repayment', 'deduction'];
const pocketTransactionTypes: PocketTransactionType[] = ['cash-in', 'expense', 'receipt', 'udhaar-given', 'udhaar-received', 'savings-transfer-out', 'savings-transfer-in'];
export const pocketCategories: PocketCategory[] = ['income', 'food', 'transport', 'bills', 'shopping', 'health', 'education', 'family', 'entertainment', 'other'];
export const MAX_RECEIPT_DATA_URL_LENGTH = 1_400_000;

export function isValidLocalDate(value: string): boolean {
  const match = localDatePattern.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidLocalTime(value: string): boolean {
  const match = localTimePattern.exec(value);
  if (!match) return false;
  const [, hour, minute] = match.map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function assertOnboardingPayload(payload: OnboardingPayload): void {
  assertProfile(payload.profile);
  assertSalaryRules(payload.salarySettings);
  assertAppPreferences(payload.appSettings);
}

export function assertProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> | UserProfile): void {
  assert(profile.firstName.trim().length > 0, 'First name is required.');
  assert(profile.employeeId.trim().length > 0, 'Employee ID is required.');
  assert(profile.designation.trim().length > 0, 'Designation is required.');
  assert(isValidLocalDate(profile.joiningDate), 'Joining date is invalid.');
}

export function assertSalaryRules(salary: Omit<SalarySettings, 'id' | 'createdAt' | 'updatedAt'> | SalarySettings): void {
  assert(isFinitePositive(salary.baseSalary), 'Base salary must be greater than zero.');
  assert(salary.salaryMode === 'fixed-monthly' || salary.salaryMode === 'daily-rate', 'Salary mode is invalid.');
  assert(salary.salaryCalculationRule === '30-days' || salary.salaryCalculationRule === '26-working-days' || salary.salaryCalculationRule === 'calendar-days', 'Salary calculation rule is invalid.');
  assert(salary.salaryMode !== 'daily-rate' || isFinitePositive(salary.dailyRate), 'Daily rate must be greater than zero.');
  assert(isValidLocalTime(salary.dutyStart) && isValidLocalTime(salary.dutyEnd), 'Duty start and end times are invalid.');
  assert(Number.isFinite(salary.shiftDurationHours) && salary.shiftDurationHours > 0 && salary.shiftDurationHours <= 24, 'Shift duration must be between 1 and 24 hours.');
  assert(Number.isInteger(salary.weeklyOffDay) && salary.weeklyOffDay >= 0 && salary.weeklyOffDay <= 6, 'Weekly off day is invalid.');
  assert(typeof salary.isWeeklyOffPaid === 'boolean', 'Weekly off setting is invalid.');
  assert(salary.autoAttendanceRule === 'off' || salary.autoAttendanceRule === 'midnight' || salary.autoAttendanceRule === 'shift-end' || salary.autoAttendanceRule === 'custom-time', 'Auto-attendance rule is invalid.');
  assert(salary.autoAttendanceRule !== 'custom-time' || (salary.autoAttendanceTime !== null && isValidLocalTime(salary.autoAttendanceTime)), 'Custom attendance time is invalid.');
  assert(salary.autoAttendanceRule === 'custom-time' || salary.autoAttendanceTime === null, 'Custom attendance time is only valid for the custom rule.');
  assert(Number.isFinite(salary.halfDayFactor) && salary.halfDayFactor > 0 && salary.halfDayFactor <= 1, 'Half-day factor is invalid.');
  assert(salary.currency === 'PKR', 'Currency is invalid.');
}

export function assertAppPreferences(appSettings: Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> | AppSettings): void {
  assert(appSettings.theme === 'dark' || appSettings.theme === 'light', 'Theme is invalid.');
  assert(appSettings.language === 'en' || appSettings.language === 'ur', 'Language is invalid.');
  assert(typeof appSettings.isPrivacyModeEnabled === 'boolean', 'Privacy mode setting is invalid.');
  assert(Number.isFinite(appSettings.lowCashThreshold) && appSettings.lowCashThreshold >= 0 && appSettings.lowCashThreshold <= 10_000_000, 'Low-cash threshold is invalid.');
}

export function assertAttendanceInput(input: Pick<AttendanceRecord, 'date' | 'status' | 'checkIn' | 'checkOut' | 'overtimeMinutes' | 'note'>): void {
  assert(isValidLocalDate(input.date), 'Attendance date is invalid.');
  assert(attendanceStatuses.includes(input.status), 'Attendance status is invalid.');
  assert(input.checkIn === null || isValidLocalTime(input.checkIn), 'Check-in time is invalid.');
  assert(input.checkOut === null || isValidLocalTime(input.checkOut), 'Check-out time is invalid.');
  assert(Number.isInteger(input.overtimeMinutes) && input.overtimeMinutes >= 0, 'Overtime must be a whole number of minutes.');
  assertTextLength(input.note, 140, 'Attendance note');
}

export function assertCompanyTransactionInput(input: { type: CompanyTransactionType; amount: number; occurredOn: string; note: string }): void {
  assert(companyTransactionTypes.includes(input.type), 'Company entry type is invalid.');
  assert(isFinitePositive(input.amount), 'Company entry amount must be greater than zero.');
  assert(isValidLocalDate(input.occurredOn), 'Company entry date is invalid.');
  assertTextLength(input.note, 140, 'Company entry note');
}

export function assertCompanyLoanInput(input: Pick<CompanyLoan, 'name' | 'principalAmount' | 'issuedOn' | 'note'>): void {
  assert(input.name.trim().length > 0 && input.name.trim().length <= 60, 'Loan name is invalid.');
  assert(isFinitePositive(input.principalAmount), 'Loan principal must be greater than zero.');
  assert(isValidLocalDate(input.issuedOn), 'Loan issue date is invalid.');
  assertTextLength(input.note, 140, 'Loan note');
}

export function assertPocketTransactionInput(input: { type: PocketTransactionType; amount: number; occurredOn: string; note: string; category: PocketCategory; receiptDataUrl: string | null; savingsGoalId: string | null; reminderOn: string | null }): void {
  assert(pocketTransactionTypes.includes(input.type), 'Pocket entry type is invalid.');
  assert(isFinitePositive(input.amount), 'Pocket entry amount must be greater than zero.');
  assert(isValidLocalDate(input.occurredOn), 'Pocket entry date is invalid.');
  assertTextLength(input.note, 140, 'Pocket entry note');
  assert(pocketCategories.includes(input.category), 'Pocket entry category is invalid.');
  assert(input.receiptDataUrl === null || (isSupportedReceiptDataUrl(input.receiptDataUrl) && input.receiptDataUrl.length <= MAX_RECEIPT_DATA_URL_LENGTH), 'Receipt image is invalid or too large.');
  assert(input.savingsGoalId === null || input.savingsGoalId.length > 0, 'Savings goal reference is invalid.');
  assert(input.reminderOn === null || isValidLocalDate(input.reminderOn), 'Udhaar reminder date is invalid.');
  assert(input.type === 'udhaar-given' || input.reminderOn === null, 'Only Udhaar given entries can have a reminder.');
  assert(['savings-transfer-out', 'savings-transfer-in'].includes(input.type) === (input.savingsGoalId !== null), 'Savings transfers must reference a goal.');
}

export function assertSavingsGoalInput(input: Pick<SavingsGoal, 'name' | 'targetAmount' | 'savedAmount' | 'targetDate' | 'note'>): void {
  assert(input.name.trim().length > 0 && input.name.trim().length <= 60, 'Savings goal name is invalid.');
  assert(isFinitePositive(input.targetAmount), 'Savings target must be greater than zero.');
  assert(Number.isFinite(input.savedAmount) && input.savedAmount >= 0, 'Saved amount cannot be negative.');
  assert(input.targetDate === null || isValidLocalDate(input.targetDate), 'Savings target date is invalid.');
  assertTextLength(input.note, 100, 'Savings note');
}

export function assertCareerRecordInput(input: Pick<CareerRecord, 'companyName' | 'designation' | 'startDate' | 'endDate' | 'monthlySalary' | 'note'>): void {
  assert(input.companyName.trim().length > 0 && input.companyName.trim().length <= 80, 'Company name is invalid.');
  assert(input.designation.trim().length > 0 && input.designation.trim().length <= 80, 'Career designation is invalid.');
  assert(isValidLocalDate(input.startDate) && isValidLocalDate(input.endDate) && input.endDate >= input.startDate, 'Career dates are invalid.');
  assert(isFinitePositive(input.monthlySalary), 'Career monthly salary must be greater than zero.');
  assertTextLength(input.note, 140, 'Career note');
}

function isFinitePositive(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function assertTextLength(value: string, maxLength: number, label: string): void {
  assert(typeof value === 'string' && value.length <= maxLength, `${label} is too long.`);
}

function isSupportedReceiptDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
