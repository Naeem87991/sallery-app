/**
 * lib/supabase/repository.ts
 * ─────────────────────────────────────────────────────────────
 * All database operations for the Salary Ticker app.
 * Every function:
 *   • accepts userId (auth.uid()) explicitly — never trusts client state
 *   • returns { data, error } so callers handle failures uniformly
 *   • uses the browser Supabase client (safe for 'use client' components)
 *   • RLS enforces ownership server-side; userId param is for query filtering
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from '@/lib/supabase/client';
import type {
  ProfileRow, ProfileInsert,
  AppSettingsRow, AppSettingsInsert,
  AttendanceRow, AttendanceInsert,
  CompanyLoanRow, CompanyLoanInsert,
  CompanyTxRow, CompanyTxInsert,
  SavingsGoalRow, SavingsGoalInsert,
  PocketTxRow, PocketTxInsert,
  CareerRow, CareerInsert,
} from '@/lib/supabase/database.types';

// ─── Result wrapper ───────────────────────────────────────────
export type DbResult<T> = { data: T; error: null } | { data: null; error: string };

function ok<T>(data: T): DbResult<T> { return { data, error: null }; }
function fail<T>(err: unknown): DbResult<T> {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[Supabase]', message);
  return { data: null, error: message };
}

// ══════════════════════════════════════════════════════════════
// PROFILE  (UserProfile + SalarySettings merged — one per user)
// ══════════════════════════════════════════════════════════════

export async function getProfile(userId: string): Promise<DbResult<ProfileRow | null>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function upsertProfile(userId: string, payload: Omit<ProfileInsert, 'user_id'>): Promise<DbResult<ProfileRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('profiles')
      .upsert({ ...payload, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// APP SETTINGS  (theme, language, privacy — one per user)
// ══════════════════════════════════════════════════════════════

export async function getAppSettings(userId: string): Promise<DbResult<AppSettingsRow | null>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('app_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function upsertAppSettings(userId: string, payload: Omit<AppSettingsInsert, 'user_id'>): Promise<DbResult<AppSettingsRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('app_settings')
      .upsert({ ...payload, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// ATTENDANCE RECORDS
// ══════════════════════════════════════════════════════════════

export async function getAttendanceRecords(userId: string, month: string): Promise<DbResult<AttendanceRow[]>> {
  try {
    const sb = createClient();
    const [year, mon] = month.split('-').map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const from = `${month}-01`;
    const to   = `${month}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await sb
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function getAllAttendanceRecords(userId: string): Promise<DbResult<AttendanceRow[]>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function upsertAttendanceRecord(userId: string, payload: Omit<AttendanceInsert, 'user_id'>): Promise<DbResult<AttendanceRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('attendance_records')
      .upsert({ ...payload, user_id: userId }, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function bulkUpsertAttendance(userId: string, records: Omit<AttendanceInsert, 'user_id'>[]): Promise<DbResult<AttendanceRow[]>> {
  try {
    const sb = createClient();
    const rows = records.map((r) => ({ ...r, user_id: userId }));
    const { data, error } = await sb
      .from('attendance_records')
      .upsert(rows, { onConflict: 'user_id,date' })
      .select();
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function deleteAttendanceRecord(userId: string, date: string): Promise<DbResult<null>> {
  try {
    const sb = createClient();
    const { error } = await sb
      .from('attendance_records')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);
    if (error) throw error;
    return ok(null);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// COMPANY LOANS
// ══════════════════════════════════════════════════════════════

export async function getCompanyLoans(userId: string): Promise<DbResult<CompanyLoanRow[]>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('company_loans')
      .select('*')
      .eq('user_id', userId)
      .order('issued_on', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function addCompanyLoan(userId: string, payload: Omit<CompanyLoanInsert, 'user_id'>): Promise<DbResult<CompanyLoanRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('company_loans')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function deleteCompanyLoan(userId: string, loanId: string): Promise<DbResult<null>> {
  try {
    const sb = createClient();
    // Delete linked transactions first (loan + all repayments)
    await sb
      .from('company_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('loan_id', loanId);
    const { error } = await sb
      .from('company_loans')
      .delete()
      .eq('user_id', userId)
      .eq('id', loanId);
    if (error) throw error;
    return ok(null);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// COMPANY TRANSACTIONS
// ══════════════════════════════════════════════════════════════

export async function getCompanyTransactions(userId: string): Promise<DbResult<CompanyTxRow[]>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('company_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_on', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function addCompanyTransaction(userId: string, payload: Omit<CompanyTxInsert, 'user_id'>): Promise<DbResult<CompanyTxRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('company_transactions')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function deleteCompanyTransaction(userId: string, txId: string): Promise<DbResult<null>> {
  try {
    const sb = createClient();
    // If this is a loan-type transaction, also delete the loan and its repayments
    const { data: tx } = await sb
      .from('company_transactions')
      .select('type, loan_id')
      .eq('user_id', userId)
      .eq('id', txId)
      .single();

    if (tx?.type === 'loan' && tx.loan_id) {
      await sb
        .from('company_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('loan_id', tx.loan_id);
      await sb
        .from('company_loans')
        .delete()
        .eq('user_id', userId)
        .eq('id', tx.loan_id);
      return ok(null);
    }

    const { error } = await sb
      .from('company_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('id', txId);
    if (error) throw error;
    return ok(null);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// SAVINGS GOALS
// ══════════════════════════════════════════════════════════════

export async function getSavingsGoals(userId: string): Promise<DbResult<SavingsGoalRow[]>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function addSavingsGoal(userId: string, payload: Omit<SavingsGoalInsert, 'user_id'>): Promise<DbResult<SavingsGoalRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('savings_goals')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function updateSavingsGoal(userId: string, goalId: string, payload: Partial<Omit<SavingsGoalInsert, 'user_id' | 'id'>>): Promise<DbResult<SavingsGoalRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('savings_goals')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', goalId)
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function deleteSavingsGoal(userId: string, goalId: string): Promise<DbResult<null>> {
  try {
    const sb = createClient();
    // Guard: don't delete a goal that has transfer history
    const { data: linked } = await sb
      .from('pocket_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('savings_goal_id', goalId)
      .limit(1)
      .maybeSingle();
    if (linked) throw new Error('This goal has transfer history and cannot be removed.');

    const { error } = await sb
      .from('savings_goals')
      .delete()
      .eq('user_id', userId)
      .eq('id', goalId);
    if (error) throw error;
    return ok(null);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// POCKET TRANSACTIONS
// ══════════════════════════════════════════════════════════════

export async function getPocketTransactions(userId: string): Promise<DbResult<PocketTxRow[]>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('pocket_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_on', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function addPocketTransaction(userId: string, payload: Omit<PocketTxInsert, 'user_id'>): Promise<DbResult<PocketTxRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('pocket_transactions')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function updatePocketTransaction(userId: string, txId: string, payload: Partial<Omit<PocketTxInsert, 'user_id' | 'id'>>): Promise<DbResult<PocketTxRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('pocket_transactions')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', txId)
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function deletePocketTransaction(userId: string, txId: string): Promise<DbResult<null>> {
  try {
    const sb = createClient();
    const { error } = await sb
      .from('pocket_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('id', txId);
    if (error) throw error;
    return ok(null);
  } catch (e) { return fail(e); }
}

// ══════════════════════════════════════════════════════════════
// CAREER RECORDS
// ══════════════════════════════════════════════════════════════

export async function getCareerRecords(userId: string): Promise<DbResult<CareerRow[]>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('career_records')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) { return fail(e); }
}

export async function addCareerRecord(userId: string, payload: Omit<CareerInsert, 'user_id'>): Promise<DbResult<CareerRow>> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from('career_records')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}

export async function deleteCareerRecord(userId: string, recordId: string): Promise<DbResult<null>> {
  try {
    const sb = createClient();
    const { error } = await sb
      .from('career_records')
      .delete()
      .eq('user_id', userId)
      .eq('id', recordId);
    if (error) throw error;
    return ok(null);
  } catch (e) { return fail(e); }
}
