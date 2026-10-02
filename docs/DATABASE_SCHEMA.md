# Database Schema — Live Salary Ticker

All tables live in the Supabase project `prnesoolelavpqjoshhv` (PostgreSQL 15).
Every table has Row Level Security enabled. Users access only their own rows via `auth.uid() = user_id`.

---

## Common columns (every table)

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | `DEFAULT gen_random_uuid()` |
| `user_id` | `UUID NOT NULL` | FK → `auth.users(id) ON DELETE CASCADE` |
| `created_at` | `TIMESTAMPTZ NOT NULL` | `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | `DEFAULT NOW()`, auto-updated by trigger |

---

## `profiles`

Stores the employee's identity and all salary calculation rules (merged from domain types `UserProfile` + `SalarySettings`). One row per user — `UNIQUE(user_id)`.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `first_name` | `TEXT NOT NULL` | | |
| `last_name` | `TEXT NOT NULL` | | `''` |
| `employee_id` | `TEXT NOT NULL` | | `''` |
| `designation` | `TEXT NOT NULL` | | `''` |
| `joining_date` | `TEXT NOT NULL` | ISO date `YYYY-MM-DD` | |
| `salary_mode` | `TEXT NOT NULL` | `CHECK IN ('fixed-monthly','daily-rate')` | `'fixed-monthly'` |
| `base_salary` | `NUMERIC(14,2) NOT NULL` | | `30000` |
| `daily_rate` | `NUMERIC(14,2)` | nullable | |
| `salary_calculation_rule` | `TEXT NOT NULL` | `CHECK IN ('30-days','26-working-days','calendar-days')` | `'30-days'` |
| `duty_start` | `TEXT NOT NULL` | `HH:MM` | `'09:00'` |
| `duty_end` | `TEXT NOT NULL` | `HH:MM` | `'17:00'` |
| `shift_duration_hours` | `NUMERIC(4,2) NOT NULL` | | `8` |
| `weekly_off_day` | `SMALLINT NOT NULL` | `CHECK BETWEEN 0 AND 6` (0=Sun) | `0` |
| `is_weekly_off_paid` | `BOOLEAN NOT NULL` | | `TRUE` |
| `auto_attendance_rule` | `TEXT NOT NULL` | `CHECK IN ('off','midnight','shift-end','custom-time')` | `'off'` |
| `auto_attendance_time` | `TEXT` | nullable, `HH:MM` | |
| `half_day_factor` | `NUMERIC(4,3) NOT NULL` | | `0.5` |
| `currency` | `TEXT NOT NULL` | | `'PKR'` |

---

## `app_settings`

User preferences: theme, language, privacy mode. One row per user — `UNIQUE(user_id)`.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `theme` | `TEXT NOT NULL` | `CHECK IN ('dark','light')` | `'dark'` |
| `language` | `TEXT NOT NULL` | `CHECK IN ('en','ur')` | `'en'` |
| `is_privacy_mode_enabled` | `BOOLEAN NOT NULL` | | `FALSE` |
| `low_cash_threshold` | `NUMERIC(14,2) NOT NULL` | | `0` |

---

## `attendance_records`

One record per calendar day per user. Indexed on `(user_id, date)`.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `date` | `TEXT NOT NULL` | `YYYY-MM-DD`, `UNIQUE(user_id, date)` | |
| `status` | `TEXT NOT NULL` | `CHECK IN ('present','absent','half-day','leave','weekly-off')` | |
| `check_in` | `TEXT` | nullable, `HH:MM` | |
| `check_out` | `TEXT` | nullable, `HH:MM` | |
| `overtime_minutes` | `INTEGER NOT NULL` | | `0` |
| `note` | `TEXT NOT NULL` | | `''` |

**Index:** `idx_attendance_user_date ON (user_id, date)`

---

## `company_loans`

Named loans with their principal amounts. Must be created before any `company_transactions` that reference them.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `name` | `TEXT NOT NULL` | | |
| `principal_amount` | `NUMERIC(14,2) NOT NULL` | `CHECK > 0` | |
| `issued_on` | `TEXT NOT NULL` | `YYYY-MM-DD` | |
| `note` | `TEXT NOT NULL` | | `''` |

**Index:** `idx_company_loans_user ON (user_id, issued_on DESC)`

---

## `company_transactions`

Company ledger entries (credits, deductions, advances, loans, repayments).

| Column | Type | Constraints | Default |
|---|---|---|---|
| `type` | `TEXT NOT NULL` | `CHECK IN ('credit','withdrawal','voucher','advance','loan','loan-repayment','deduction')` | |
| `amount` | `NUMERIC(14,2) NOT NULL` | `CHECK > 0` | |
| `occurred_on` | `TEXT NOT NULL` | `YYYY-MM-DD` | |
| `note` | `TEXT NOT NULL` | | `''` |
| `loan_id` | `UUID` | nullable FK → `company_loans(id) ON DELETE SET NULL` | |

**Indexes:** `idx_company_tx_user ON (user_id, occurred_on DESC)`, `idx_company_tx_loan ON (loan_id)`

---

## `savings_goals`

Named savings targets with current saved amount.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `name` | `TEXT NOT NULL` | | |
| `target_amount` | `NUMERIC(14,2) NOT NULL` | | `0` |
| `saved_amount` | `NUMERIC(14,2) NOT NULL` | | `0` |
| `target_date` | `TEXT` | nullable, `YYYY-MM-DD` | |
| `note` | `TEXT NOT NULL` | | `''` |

**Index:** `idx_savings_goals_user ON (user_id)`

---

## `pocket_transactions`

Personal cash movements: income, expenses, receipts, Udhaar (lending), savings transfers.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `type` | `TEXT NOT NULL` | `CHECK IN ('cash-in','expense','receipt','udhaar-given','udhaar-received','savings-transfer-out','savings-transfer-in')` | |
| `amount` | `NUMERIC(14,2) NOT NULL` | `CHECK > 0` | |
| `occurred_on` | `TEXT NOT NULL` | `YYYY-MM-DD` | |
| `note` | `TEXT NOT NULL` | | `''` |
| `category` | `TEXT NOT NULL` | `CHECK IN ('income','food','transport','bills','shopping','health','education','family','entertainment','other')` | `'other'` |
| `receipt_data_url` | `TEXT` | nullable, base64 data-URL | |
| `savings_goal_id` | `UUID` | nullable FK → `savings_goals(id) ON DELETE SET NULL` | |
| `reminder_on` | `TEXT` | nullable, `YYYY-MM-DD` — Udhaar due date | |

**Indexes:** `idx_pocket_tx_user ON (user_id, occurred_on DESC)`, `idx_pocket_tx_goal ON (savings_goal_id)`

---

## `career_records`

Past employment history for lifetime earnings calculation.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `company_name` | `TEXT NOT NULL` | | |
| `designation` | `TEXT NOT NULL` | | |
| `start_date` | `TEXT NOT NULL` | `YYYY-MM-DD` | |
| `end_date` | `TEXT NOT NULL` | `YYYY-MM-DD` | |
| `monthly_salary` | `NUMERIC(14,2) NOT NULL` | | `0` |
| `note` | `TEXT NOT NULL` | | `''` |

**Index:** `idx_career_user ON (user_id, start_date DESC)`

---

## What is NOT in Supabase

| Data | Location | Reason |
|---|---|---|
| `security_settings` (PIN hash, PIN salt, passkey credential) | IndexedDB (Dexie) only | Cryptographic secrets must never leave the device |

---

## Relationships diagram

```
auth.users
  │
  ├── profiles (1:1)
  ├── app_settings (1:1)
  ├── attendance_records (1:many)
  ├── company_loans (1:many)
  │     └── company_transactions.loan_id (many:1, nullable)
  ├── company_transactions (1:many)
  ├── savings_goals (1:many)
  │     └── pocket_transactions.savings_goal_id (many:1, nullable)
  ├── pocket_transactions (1:many)
  └── career_records (1:many)
```
