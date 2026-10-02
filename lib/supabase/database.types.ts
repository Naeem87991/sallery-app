// ============================================================
// database.types.ts — Supabase TypeScript types
// Matches 001_initial_schema.sql exactly.
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          employee_id: string;
          designation: string;
          joining_date: string;
          salary_mode: 'fixed-monthly' | 'daily-rate';
          base_salary: number;
          daily_rate: number | null;
          salary_calculation_rule: '30-days' | '26-working-days' | 'calendar-days';
          duty_start: string;
          duty_end: string;
          shift_duration_hours: number;
          weekly_off_day: number;
          is_weekly_off_paid: boolean;
          auto_attendance_rule: 'off' | 'midnight' | 'shift-end' | 'custom-time';
          auto_attendance_time: string | null;
          half_day_factor: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name?: string;
          employee_id?: string;
          designation?: string;
          joining_date: string;
          salary_mode?: 'fixed-monthly' | 'daily-rate';
          base_salary?: number;
          daily_rate?: number | null;
          salary_calculation_rule?: '30-days' | '26-working-days' | 'calendar-days';
          duty_start?: string;
          duty_end?: string;
          shift_duration_hours?: number;
          weekly_off_day?: number;
          is_weekly_off_paid?: boolean;
          auto_attendance_rule?: 'off' | 'midnight' | 'shift-end' | 'custom-time';
          auto_attendance_time?: string | null;
          half_day_factor?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      app_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: 'dark' | 'light';
          language: 'en' | 'ur';
          is_privacy_mode_enabled: boolean;
          low_cash_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'dark' | 'light';
          language?: 'en' | 'ur';
          is_privacy_mode_enabled?: boolean;
          low_cash_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
      };

      attendance_records: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off';
          check_in: string | null;
          check_out: string | null;
          overtime_minutes: number;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off';
          check_in?: string | null;
          check_out?: string | null;
          overtime_minutes?: number;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };

      company_loans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          principal_amount: number;
          issued_on: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          principal_amount: number;
          issued_on: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['company_loans']['Insert']>;
      };

      company_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'credit' | 'withdrawal' | 'voucher' | 'advance' | 'loan' | 'loan-repayment' | 'deduction';
          amount: number;
          occurred_on: string;
          note: string;
          loan_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'credit' | 'withdrawal' | 'voucher' | 'advance' | 'loan' | 'loan-repayment' | 'deduction';
          amount: number;
          occurred_on: string;
          note?: string;
          loan_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['company_transactions']['Insert']>;
      };

      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          saved_amount: number;
          target_date: string | null;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount?: number;
          saved_amount?: number;
          target_date?: string | null;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['savings_goals']['Insert']>;
      };

      pocket_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'cash-in' | 'expense' | 'receipt' | 'udhaar-given' | 'udhaar-received' | 'savings-transfer-out' | 'savings-transfer-in';
          amount: number;
          occurred_on: string;
          note: string;
          category: 'income' | 'food' | 'transport' | 'bills' | 'shopping' | 'health' | 'education' | 'family' | 'entertainment' | 'other';
          receipt_data_url: string | null;
          savings_goal_id: string | null;
          reminder_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'cash-in' | 'expense' | 'receipt' | 'udhaar-given' | 'udhaar-received' | 'savings-transfer-out' | 'savings-transfer-in';
          amount: number;
          occurred_on: string;
          note?: string;
          category?: 'income' | 'food' | 'transport' | 'bills' | 'shopping' | 'health' | 'education' | 'family' | 'entertainment' | 'other';
          receipt_data_url?: string | null;
          savings_goal_id?: string | null;
          reminder_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pocket_transactions']['Insert']>;
      };

      career_records: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          designation: string;
          start_date: string;
          end_date: string;
          monthly_salary: number;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          designation: string;
          start_date: string;
          end_date: string;
          monthly_salary?: number;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['career_records']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// ── Convenience row types ──────────────────────────────────
export type ProfileRow        = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert     = Database['public']['Tables']['profiles']['Insert'];
export type AppSettingsRow    = Database['public']['Tables']['app_settings']['Row'];
export type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type AttendanceRow     = Database['public']['Tables']['attendance_records']['Row'];
export type AttendanceInsert  = Database['public']['Tables']['attendance_records']['Insert'];
export type CompanyLoanRow    = Database['public']['Tables']['company_loans']['Row'];
export type CompanyLoanInsert = Database['public']['Tables']['company_loans']['Insert'];
export type CompanyTxRow      = Database['public']['Tables']['company_transactions']['Row'];
export type CompanyTxInsert   = Database['public']['Tables']['company_transactions']['Insert'];
export type SavingsGoalRow    = Database['public']['Tables']['savings_goals']['Row'];
export type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert'];
export type PocketTxRow       = Database['public']['Tables']['pocket_transactions']['Row'];
export type PocketTxInsert    = Database['public']['Tables']['pocket_transactions']['Insert'];
export type CareerRow         = Database['public']['Tables']['career_records']['Row'];
export type CareerInsert      = Database['public']['Tables']['career_records']['Insert'];
