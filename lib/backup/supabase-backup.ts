'use client';

/**
 * Supabase-backed backup data reader.
 * Collects all of the signed-in user's data from Supabase
 * and returns it in the same BackupData shape the backup system uses.
 *
 * Called from createEncryptedBackup() when the user exports a backup.
 * The encryption + validation logic in local-backup.ts remains unchanged.
 */

import { createClient } from '@/lib/supabase/client';
import { CURRENT_RECORD_ID } from '@/types/domain';
import type {
  AppSettings,
  AttendanceRecord,
  CareerRecord,
  CompanyLoan,
  CompanyTransaction,
  PocketTransaction,
  SalarySettings,
  SavingsGoal,
  UserProfile,
} from '@/types/domain';

export type SupabaseBackupData = {
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

export async function readSupabaseBackupData(): Promise<SupabaseBackupData> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('You must be signed in to export a backup.');

  const uid = user.id;

  const [
    profileRes, settingsRes, attendanceRes,
    companyTxRes, companyLoanRes,
    pocketTxRes, savingsRes, careerRes,
  ] = await Promise.all([
    sb.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
    sb.from('app_settings').select('*').eq('user_id', uid).maybeSingle(),
    sb.from('attendance_records').select('*').eq('user_id', uid).order('date'),
    sb.from('company_transactions').select('*').eq('user_id', uid).order('occurred_on'),
    sb.from('company_loans').select('*').eq('user_id', uid).order('issued_on'),
    sb.from('pocket_transactions').select('*').eq('user_id', uid).order('occurred_on'),
    sb.from('savings_goals').select('*').eq('user_id', uid),
    sb.from('career_records').select('*').eq('user_id', uid).order('start_date'),
  ]);

  const now = new Date().toISOString();

  // Map profile row → domain UserProfile + SalarySettings
  const profileRow = profileRes.data;
  const profiles: UserProfile[] = profileRow ? [{
    id: CURRENT_RECORD_ID,
    firstName: profileRow.first_name,
    lastName: profileRow.last_name,
    employeeId: profileRow.employee_id,
    designation: profileRow.designation,
    joiningDate: profileRow.joining_date,
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
  }] : [];

  const salarySettings: SalarySettings[] = profileRow ? [{
    id: CURRENT_RECORD_ID,
    salaryMode: profileRow.salary_mode,
    baseSalary: Number(profileRow.base_salary),
    dailyRate: profileRow.daily_rate != null ? Number(profileRow.daily_rate) : null,
    salaryCalculationRule: profileRow.salary_calculation_rule,
    dutyStart: profileRow.duty_start,
    dutyEnd: profileRow.duty_end,
    shiftDurationHours: Number(profileRow.shift_duration_hours),
    weeklyOffDay: profileRow.weekly_off_day,
    isWeeklyOffPaid: profileRow.is_weekly_off_paid,
    autoAttendanceRule: profileRow.auto_attendance_rule,
    autoAttendanceTime: profileRow.auto_attendance_time,
    halfDayFactor: Number(profileRow.half_day_factor),
    currency: 'PKR',
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
  }] : [];

  const settingsRow = settingsRes.data;
  const appSettings: AppSettings[] = settingsRow ? [{
    id: CURRENT_RECORD_ID,
    theme: settingsRow.theme,
    language: settingsRow.language,
    isPrivacyModeEnabled: settingsRow.is_privacy_mode_enabled,
    lowCashThreshold: Number(settingsRow.low_cash_threshold),
    createdAt: settingsRow.created_at,
    updatedAt: settingsRow.updated_at,
  }] : [];

  const attendanceRecords: AttendanceRecord[] = (attendanceRes.data ?? []).map((r) => ({
    id: r.date,
    date: r.date,
    status: r.status,
    checkIn: r.check_in,
    checkOut: r.check_out,
    overtimeMinutes: r.overtime_minutes,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const companyTransactions: CompanyTransaction[] = (companyTxRes.data ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    occurredOn: r.occurred_on,
    note: r.note,
    loanId: r.loan_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const companyLoans: CompanyLoan[] = (companyLoanRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    principalAmount: Number(r.principal_amount),
    issuedOn: r.issued_on,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const pocketTransactions: PocketTransaction[] = (pocketTxRes.data ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    occurredOn: r.occurred_on,
    note: r.note,
    category: r.category,
    receiptDataUrl: r.receipt_data_url,
    savingsGoalId: r.savings_goal_id,
    reminderOn: r.reminder_on,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const savingsGoals: SavingsGoal[] = (savingsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    targetAmount: Number(r.target_amount),
    savedAmount: Number(r.saved_amount),
    targetDate: r.target_date,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const careerRecords: CareerRecord[] = (careerRes.data ?? []).map((r) => ({
    id: r.id,
    companyName: r.company_name,
    designation: r.designation,
    startDate: r.start_date,
    endDate: r.end_date,
    monthlySalary: Number(r.monthly_salary),
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  void now; // suppress unused warning
  return { profiles, salarySettings, appSettings, attendanceRecords, companyTransactions, companyLoans, pocketTransactions, savingsGoals, careerRecords };
}
