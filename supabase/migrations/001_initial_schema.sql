-- ============================================================
-- 001_initial_schema.sql
-- Live Salary Ticker — Supabase PostgreSQL schema
-- Run this first in the Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- profiles
-- Stores UserProfile + SalarySettings merged (one row per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- UserProfile fields
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL DEFAULT '',
  employee_id     TEXT NOT NULL DEFAULT '',
  designation     TEXT NOT NULL DEFAULT '',
  joining_date    TEXT NOT NULL,          -- ISO date string YYYY-MM-DD

  -- SalarySettings fields
  salary_mode                 TEXT NOT NULL DEFAULT 'fixed-monthly'
                              CHECK (salary_mode IN ('fixed-monthly','daily-rate')),
  base_salary                 NUMERIC(14,2) NOT NULL DEFAULT 30000,
  daily_rate                  NUMERIC(14,2),
  salary_calculation_rule     TEXT NOT NULL DEFAULT '30-days'
                              CHECK (salary_calculation_rule IN ('30-days','26-working-days','calendar-days')),
  duty_start                  TEXT NOT NULL DEFAULT '09:00',
  duty_end                    TEXT NOT NULL DEFAULT '17:00',
  shift_duration_hours        NUMERIC(4,2) NOT NULL DEFAULT 8,
  weekly_off_day              SMALLINT NOT NULL DEFAULT 0
                              CHECK (weekly_off_day BETWEEN 0 AND 6),
  is_weekly_off_paid          BOOLEAN NOT NULL DEFAULT TRUE,
  auto_attendance_rule        TEXT NOT NULL DEFAULT 'off'
                              CHECK (auto_attendance_rule IN ('off','midnight','shift-end','custom-time')),
  auto_attendance_time        TEXT,
  half_day_factor             NUMERIC(4,3) NOT NULL DEFAULT 0.5,
  currency                    TEXT NOT NULL DEFAULT 'PKR',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id)             -- one profile per user
);

-- ============================================================
-- app_settings
-- One row per user: theme, language, privacy mode, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  theme                   TEXT NOT NULL DEFAULT 'dark'
                          CHECK (theme IN ('dark','light')),
  language                TEXT NOT NULL DEFAULT 'en'
                          CHECK (language IN ('en','ur')),
  is_privacy_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  low_cash_threshold      NUMERIC(14,2) NOT NULL DEFAULT 0,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id)
);

-- ============================================================
-- attendance_records
-- One row per calendar day per user
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date                TEXT NOT NULL,        -- YYYY-MM-DD
  status              TEXT NOT NULL
                      CHECK (status IN ('present','absent','half-day','leave','weekly-off')),
  check_in            TEXT,                 -- HH:MM or NULL
  check_out           TEXT,                 -- HH:MM or NULL
  overtime_minutes    INTEGER NOT NULL DEFAULT 0,
  note                TEXT NOT NULL DEFAULT '',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, date)   -- one record per user per day
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date
  ON attendance_records (user_id, date);

-- ============================================================
-- company_loans
-- Named loans (principal) — must exist before loan transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS company_loans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name             TEXT NOT NULL,
  principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount > 0),
  issued_on        TEXT NOT NULL,   -- YYYY-MM-DD
  note             TEXT NOT NULL DEFAULT '',

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_loans_user
  ON company_loans (user_id, issued_on DESC);

-- ============================================================
-- company_transactions
-- Credits, deductions, advances, vouchers, loan entries
-- ============================================================
CREATE TABLE IF NOT EXISTS company_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type        TEXT NOT NULL
              CHECK (type IN ('credit','withdrawal','voucher','advance','loan','loan-repayment','deduction')),
  amount      NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  occurred_on TEXT NOT NULL,   -- YYYY-MM-DD
  note        TEXT NOT NULL DEFAULT '',
  loan_id     UUID REFERENCES company_loans(id) ON DELETE SET NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_tx_user
  ON company_transactions (user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_company_tx_loan
  ON company_transactions (loan_id);

-- ============================================================
-- savings_goals
-- Named savings targets, with current saved amount
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name          TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  saved_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_date   TEXT,          -- YYYY-MM-DD or NULL
  note          TEXT NOT NULL DEFAULT '',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user
  ON savings_goals (user_id);

-- ============================================================
-- pocket_transactions
-- Cash in/out, expenses, receipts, Udhaar, savings transfers
-- ============================================================
CREATE TABLE IF NOT EXISTS pocket_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type             TEXT NOT NULL
                   CHECK (type IN ('cash-in','expense','receipt','udhaar-given','udhaar-received','savings-transfer-out','savings-transfer-in')),
  amount           NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  occurred_on      TEXT NOT NULL,   -- YYYY-MM-DD
  note             TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL DEFAULT 'other'
                   CHECK (category IN ('income','food','transport','bills','shopping','health','education','family','entertainment','other')),
  receipt_data_url TEXT,            -- base64 data-URL or NULL
  savings_goal_id  UUID REFERENCES savings_goals(id) ON DELETE SET NULL,
  reminder_on      TEXT,            -- YYYY-MM-DD or NULL (Udhaar reminder)

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pocket_tx_user
  ON pocket_transactions (user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_pocket_tx_goal
  ON pocket_transactions (savings_goal_id);

-- ============================================================
-- career_records
-- Past employment history
-- ============================================================
CREATE TABLE IF NOT EXISTS career_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  company_name   TEXT NOT NULL,
  designation    TEXT NOT NULL,
  start_date     TEXT NOT NULL,   -- YYYY-MM-DD
  end_date       TEXT NOT NULL,   -- YYYY-MM-DD
  monthly_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
  note           TEXT NOT NULL DEFAULT '',

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_user
  ON career_records (user_id, start_date DESC);
