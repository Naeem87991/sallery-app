# Supabase Integration Audit

## 1. Current Architecture

### Runtime Stack
- **Framework**: Next.js (App Router, `app/` directory, all pages are Server Components wrapping `'use client'` leaf components)
- **Database**: Dexie v4 wrapping IndexedDB — entirely client-side, schema version 7
- **Reactive layer**: `dexie-react-hooks` `useLiveQuery` — subscriptions that re-render components on DB change
- **Auth**: None — single-user, no login, no accounts
- **PWA**: Service worker registered via `RegisterServiceWorker` component; app has a web manifest
- **PDF export**: `pdf-lib` used in `lib/reports/local-exports.ts`
- **Security**: Local PIN (PBKDF2/SHA-256 + AES-GCM) + WebAuthn passkey stored in IndexedDB (`securitySettings` table), unlocking handled entirely client-side via `sessionStorage`
- **i18n**: English + Urdu RTL, runtime-switched via `AppSettings.language`
- **Backup**: AES-GCM encrypted JSON export/import from `lib/backup/local-backup.ts`

### Data Flow (current)
```
IndexedDB (Dexie)
  └── lib/database/database.ts   (LiveSalaryTickerDatabase class, db singleton)
  └── lib/database/repository.ts (all write operations + validation calls)
        └── lib/validation/domain.ts (assert* guards)
  └── hooks/use-*.ts             (useLiveQuery subscriptions → reactive state)
        └── components/**/*-content.tsx  (render + call repository for mutations)
```

### File structure
```
app/
  layout.tsx          — root layout, RegisterServiceWorker
  page.tsx            — / (home/dashboard)
  attendance/page.tsx — /attendance
  career/page.tsx     — /career
  company/page.tsx    — /company
  offline/page.tsx    — /offline (PWA offline fallback)
  onboarding/page.tsx — /onboarding
  pocket/page.tsx     — /pocket
  reports/page.tsx    — /reports
  settings/page.tsx   — /settings
  globals.css
  manifest.ts

components/
  attendance/attendance-content.tsx
  attendance/automatic-attendance-controller.tsx
  career/career-content.tsx
  company/company-content.tsx
  dashboard/dashboard-content.tsx
  layout/app-shell.tsx
  layout/feature-placeholder.tsx
  layout/localized-surface.tsx
  layout/mobile-bottom-nav.tsx
  layout/mobile-header.tsx
  onboarding/onboarding-wizard.tsx
  pocket/pocket-content.tsx
  pwa/register-service-worker.tsx
  reports/reports-content.tsx
  security/app-lock-screen.tsx
  settings/backup-panel.tsx
  settings/security-panel.tsx
  settings/settings-content.tsx
  ui/app-icon.tsx

hooks/
  use-all-attendance-records.ts   — useLiveQuery → all attendance rows ordered by date
  use-app-translation.ts          — reads language from useCurrentAppRecords
  use-attendance-records.ts       — useLiveQuery → month-filtered attendance
  use-career-records.ts           — useLiveQuery → career records ordered by startDate DESC
  use-company-loans.ts            — useLiveQuery → loans ordered by issuedOn DESC
  use-company-transactions.ts     — useLiveQuery → transactions ordered by occurredOn DESC
  use-current-app-records.ts      — useLiveQuery → profiles + salarySettings + appSettings
  use-pocket-records.ts           — useLiveQuery → pocketTransactions + savingsGoals
  use-security-settings.ts        — useLiveQuery → securitySettings

lib/
  attendance/attendance-workflows.ts
  attendance/attendance-workflows.test.ts
  attendance/auto-attendance.ts
  attendance/auto-attendance.test.ts
  backup/local-backup.ts          — AES-GCM encrypted JSON backup/restore
  calculations/career-earnings.ts
  calculations/company-balance.ts
  calculations/earnings.ts
  calculations/pocket-balance.ts
  calculations/regression.test.ts
  database/database.ts            — Dexie DB class, schema versions 1–7
  database/repository.ts          — all CRUD operations
  formatting/currency.ts
  formatting/date.ts
  i18n/translations.ts
  reports/local-exports.ts        — PDF generation via pdf-lib
  security/passkey.ts             — WebAuthn registration/verification
  security/pin.ts                 — PBKDF2 PIN hash/verify (client-only)
  security/session-lock.ts        — sessionStorage unlock token (client-only)
  validation/domain.ts            — assert* validation functions
```

---

## 2. All Application Features

| Feature | Route | Component | Description |
|---|---|---|---|
| Dashboard / Live Earnings Ticker | `/` | `dashboard-content.tsx` | Real-time salary counter using local clock; shows company balance, pocket balance, base salary |
| Onboarding Wizard | `/onboarding` | `onboarding-wizard.tsx` | 3-step setup: identity → salary rules → work style |
| Attendance Tracking | `/attendance` | `attendance-content.tsx` | Calendar view, day editor (status, check-in/out, overtime, note), bulk fill, filter by status |
| Company Ledger | `/company` | `company-content.tsx` | Credits/debits/vouchers/advances/deductions, loan tracker with repayments |
| Personal Pocket | `/pocket` | `pocket-content.tsx` | Cash in/out, categories, receipt images (data-URL), Udhaar (lending) with reminders |
| Savings Goals | `/pocket` | `pocket-content.tsx` | Named goals with target amounts, savings transfers linked to pocket ledger |
| Career History | `/career` | `career-content.tsx` | Past employment records, lifetime earnings estimate |
| Settings | `/settings` | `settings-content.tsx` | Profile, salary rules, attendance defaults, low-cash threshold, theme, language, privacy mode |
| Security (PIN + Passkey) | `/settings` | `security-panel.tsx` | PBKDF2 PIN, WebAuthn passkey — fully client-side, never leaves device |
| App Lock Screen | any route | `app-lock-screen.tsx` | PIN/passkey gate on every page when isPinEnabled |
| Backup & Restore | `/settings` | `backup-panel.tsx` | AES-GCM encrypted JSON export/import |
| Reports / PDF Export | `/reports` | `reports-content.tsx` | pdf-lib PDF generation from local data |
| PWA / Offline | `/offline` | `offline/page.tsx` | Service worker offline fallback |
| Automatic Attendance | everywhere | `automatic-attendance-controller.tsx` | Background controller that fires auto-attendance rules |
| Privacy Mode | everywhere | `app-shell.tsx` | Toggle that blurs all financial figures |
| i18n (English / Urdu RTL) | everywhere | all components | Runtime language switch, full RTL support |

---

## 3. All Data Models

### From `types/domain.ts`

#### Singleton records (id = 'current', one per local DB)
| Type | Fields |
|---|---|
| `UserProfile` | `id`, `firstName`, `lastName`, `employeeId`, `designation`, `joiningDate`, `createdAt`, `updatedAt` |
| `SalarySettings` | `id`, `salaryMode`, `baseSalary`, `dailyRate`, `salaryCalculationRule`, `dutyStart`, `dutyEnd`, `shiftDurationHours`, `weeklyOffDay`, `isWeeklyOffPaid`, `autoAttendanceRule`, `autoAttendanceTime`, `halfDayFactor`, `currency`, `createdAt`, `updatedAt` |
| `AppSettings` | `id`, `theme`, `language`, `isPrivacyModeEnabled`, `lowCashThreshold`, `createdAt`, `updatedAt` |
| `SecuritySettings` | `id`, `isPinEnabled`, `pinHash`, `pinSalt`, `passkeyCredentialId`, `createdAt`, `updatedAt` — **LOCAL ONLY, never synced** |

#### Collection records (many per user)
| Type | Fields |
|---|---|
| `AttendanceRecord` | `id` (date string YYYY-MM-DD), `date`, `status`, `checkIn`, `checkOut`, `overtimeMinutes`, `note`, `createdAt`, `updatedAt` |
| `CompanyTransaction` | `id`, `type`, `amount`, `occurredOn`, `note`, `loanId` (nullable), `createdAt`, `updatedAt` |
| `CompanyLoan` | `id`, `name`, `principalAmount`, `issuedOn`, `note`, `createdAt`, `updatedAt` |
| `PocketTransaction` | `id`, `type`, `amount`, `occurredOn`, `note`, `category`, `receiptDataUrl` (nullable data-URL), `savingsGoalId` (nullable FK), `reminderOn` (nullable date), `createdAt`, `updatedAt` |
| `SavingsGoal` | `id`, `name`, `targetAmount`, `savedAmount`, `targetDate` (nullable), `note`, `createdAt`, `updatedAt` |
| `CareerRecord` | `id`, `companyName`, `designation`, `startDate`, `endDate`, `monthlySalary`, `note`, `createdAt`, `updatedAt` |

### Dexie Schema (version 7, `lib/database/database.ts`)
| Table | Indexes |
|---|---|
| `profiles` | `&id` (unique PK), `updatedAt` |
| `salarySettings` | `&id`, `updatedAt` |
| `appSettings` | `&id`, `updatedAt` |
| `attendanceRecords` | `&id`, `date`, `status`, `updatedAt` |
| `companyTransactions` | `&id`, `occurredOn`, `type`, `loanId`, `updatedAt` |
| `companyLoans` | `&id`, `issuedOn`, `updatedAt` |
| `pocketTransactions` | `&id`, `occurredOn`, `type`, `savingsGoalId`, `reminderOn`, `updatedAt` |
| `savingsGoals` | `&id`, `targetDate`, `updatedAt` |
| `careerRecords` | `&id`, `startDate`, `endDate`, `updatedAt` |
| `securitySettings` | `&id`, `updatedAt` — **LOCAL ONLY** |

### Key enum types
- `SalaryMode`: `fixed-monthly` | `daily-rate`
- `SalaryCalculationRule`: `30-days` | `26-working-days` | `calendar-days`
- `AutoAttendanceRule`: `off` | `midnight` | `shift-end` | `custom-time`
- `AttendanceStatus`: `present` | `absent` | `half-day` | `leave` | `weekly-off`
- `CompanyTransactionType`: `credit` | `withdrawal` | `voucher` | `advance` | `loan` | `loan-repayment` | `deduction`
- `PocketTransactionType`: `cash-in` | `expense` | `receipt` | `udhaar-given` | `udhaar-received` | `savings-transfer-out` | `savings-transfer-in`
- `PocketCategory`: `income` | `food` | `transport` | `bills` | `shopping` | `health` | `education` | `family` | `entertainment` | `other`

---

## 4. Current Data Flow

```
Component mount
  │
  ├─ useLiveQuery (Dexie) ──► IndexedDB read ──► reactive state (re-renders on any write)
  │
  └─ User action (form submit)
       │
       └─ repository.ts function (assertX validation, then db.table.put/add/delete)
            │
            └─ IndexedDB write ──► triggers all useLiveQuery subscribers automatically
```

Key reactive hooks and what they subscribe to:
- `useCurrentAppRecords` — `profiles`, `salarySettings`, `appSettings` (singleton records)
- `useAttendanceRecords(month)` — `attendanceRecords` filtered by date range
- `useAllAttendanceRecords` — all `attendanceRecords` ordered by date
- `useCompanyTransactions` — all `companyTransactions` ordered by `occurredOn` DESC
- `useCompanyLoans` — all `companyLoans` ordered by `issuedOn` DESC
- `usePocketRecords` — all `pocketTransactions` + all `savingsGoals`
- `useCareerRecords` — all `careerRecords` ordered by `startDate` DESC
- `useSecuritySettings` — `securitySettings` singleton

---

## 5. What to Replace with Supabase

### Replace
| Current | Replacement |
|---|---|
| `lib/database/database.ts` (Dexie class) | Keep for local cache; add `lib/supabase/client.ts` for browser Supabase client |
| `lib/database/repository.ts` (Dexie writes) | Replace all functions with Supabase `insert/update/delete` calls (upsert pattern for singletons) |
| `hooks/use-current-app-records.ts` | Replace `useLiveQuery` with `useEffect` + Supabase `select` + realtime subscription |
| `hooks/use-attendance-records.ts` | Replace with Supabase query + realtime |
| `hooks/use-all-attendance-records.ts` | Replace with Supabase query |
| `hooks/use-company-transactions.ts` | Replace with Supabase query + realtime |
| `hooks/use-company-loans.ts` | Replace with Supabase query + realtime |
| `hooks/use-pocket-records.ts` | Replace with Supabase query + realtime |
| `hooks/use-career-records.ts` | Replace with Supabase query + realtime |
| `app/layout.tsx` | Add Supabase auth session provider wrapper |
| `app/page.tsx` and all route pages | Add auth guard (redirect to `/login` if not authenticated) |
| `next.config.ts` | Add Supabase URLs to `connect-src` CSP directive |
| `.env.local` | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

### Keep (unchanged)
| File | Reason |
|---|---|
| `lib/security/pin.ts` | PIN hashing stays 100% client-side |
| `lib/security/passkey.ts` | WebAuthn stays 100% client-side |
| `lib/security/session-lock.ts` | sessionStorage lock stays client-side |
| `lib/backup/local-backup.ts` | Backup export/import logic unchanged |
| `lib/calculations/*.ts` | Pure computation, no DB dependency |
| `lib/formatting/*.ts` | Pure formatting, no DB dependency |
| `lib/validation/domain.ts` | Validation guards reused by new repository |
| `lib/i18n/translations.ts` | i18n stays unchanged |
| `lib/reports/local-exports.ts` | PDF export uses in-memory data |
| `components/security/*` | PIN/passkey UI stays local |
| `types/domain.ts` | Domain types map directly to Supabase columns |

### Create (new files)
| New File | Purpose |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client singleton (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server-side Supabase client (`createServerClient`) |
| `lib/supabase/middleware.ts` | Session refresh middleware helper |
| `middleware.ts` | Next.js middleware to refresh Supabase auth session on every request |
| `app/(auth)/login/page.tsx` | Email magic-link / OAuth login page |
| `app/(auth)/auth/callback/route.ts` | Supabase auth callback route handler |
| `hooks/use-auth.ts` | Hook exposing `session`, `user`, `signOut` |
| `hooks/use-profile.ts` | Hook for `profiles` table (merges UserProfile + SalarySettings) |
| `supabase/migrations/001_initial_schema.sql` | All 8 tables |
| `supabase/migrations/002_row_level_security.sql` | RLS policies |
| `supabase/migrations/003_updated_at_trigger.sql` | `updated_at` auto-trigger |
| `docs/SUPABASE_AUDIT.md` | This file |
| `docs/DATABASE_SCHEMA.md` | Schema reference |
| `docs/SUPABASE_ARCHITECTURE.md` | Architecture reference |
| `docs/RLS_SECURITY.md` | RLS policy documentation |
| `docs/SECURITY_AUDIT.md` | Security audit |

---

## 6. Files That Will Be Modified (Full Paths)

```
d:\live-sallery-ticker-app\next.config.ts
d:\live-sallery-ticker-app\.env.local
d:\live-sallery-ticker-app\package.json
d:\live-sallery-ticker-app\app\layout.tsx
d:\live-sallery-ticker-app\app\page.tsx
d:\live-sallery-ticker-app\app\attendance\page.tsx
d:\live-sallery-ticker-app\app\career\page.tsx
d:\live-sallery-ticker-app\app\company\page.tsx
d:\live-sallery-ticker-app\app\onboarding\page.tsx
d:\live-sallery-ticker-app\app\pocket\page.tsx
d:\live-sallery-ticker-app\app\reports\page.tsx
d:\live-sallery-ticker-app\app\settings\page.tsx
d:\live-sallery-ticker-app\lib\database\repository.ts
d:\live-sallery-ticker-app\hooks\use-current-app-records.ts
d:\live-sallery-ticker-app\hooks\use-attendance-records.ts
d:\live-sallery-ticker-app\hooks\use-all-attendance-records.ts
d:\live-sallery-ticker-app\hooks\use-company-transactions.ts
d:\live-sallery-ticker-app\hooks\use-company-loans.ts
d:\live-sallery-ticker-app\hooks\use-pocket-records.ts
d:\live-sallery-ticker-app\hooks\use-career-records.ts
d:\live-sallery-ticker-app\hooks\use-security-settings.ts
d:\live-sallery-ticker-app\components\onboarding\onboarding-wizard.tsx
d:\live-sallery-ticker-app\components\settings\settings-content.tsx
d:\live-sallery-ticker-app\components\layout\app-shell.tsx
d:\live-sallery-ticker-app\components\settings\backup-panel.tsx
```

---

## 7. Risks and Decisions

### CSP — Critical Blocker
`next.config.ts` currently has `connect-src 'self'`. Supabase requires adding the project URL to `connect-src` and `img-src`. Exact values:
- `connect-src`: add `https://prnesoolelavpqjoshhv.supabase.co https://prnesoolelavpqjoshhv.supabase.co wss://prnesoolelavpqjoshhv.supabase.co` (WSS for realtime)
- Without this change the browser will silently block all Supabase API and realtime calls.

### Packages Not Yet Installed
`@supabase/supabase-js` and `@supabase/ssr` are not in `package.json`. They must be added before any Supabase code runs. Use exact pinned versions.

### SecuritySettings — Local Only
`SecuritySettings` (PIN hash, PIN salt, passkey credential ID) must **never** be stored in Supabase. The table stays in IndexedDB only. PINs are hashed with PBKDF2 (210,000 iterations) client-side; sending them to a server would violate the security model. The `securitySettings` Dexie table is excluded from backup data sent to Supabase and has no corresponding SQL table.

### Receipt Data URLs
`PocketTransaction.receiptDataUrl` stores raw base64-encoded image data (up to ~1.4 MB per receipt). Storing this in a Postgres TEXT column is valid but inefficient at scale. For the initial integration, keep it as-is in the `receipt_data_url TEXT` column. A future migration can move receipts to Supabase Storage.

### Onboarding Flow Change
Currently onboarding saves a single `CURRENT_RECORD_ID = 'current'` singleton locally. With Supabase, onboarding must `UPSERT` into `profiles` and `app_settings` using `user_id` as the conflict key. The `isOnboarded` check changes from "does the local Dexie record exist?" to "does a `profiles` row exist for this user?".

### Auth Strategy
Email magic-link is the most friction-free option for a personal finance app with multiple users. OAuth (Google) is an alternative. Both are supported by `@supabase/ssr`. Decision: implement email magic-link first; OAuth can be added later without schema changes.

### Dexie Removal
Dexie can be removed entirely once all hooks and repository functions are migrated to Supabase. The `lib/database/database.ts` file and `dexie`/`dexie-react-hooks` npm packages can be deleted in the final cleanup phase.

### Realtime vs Polling
Supabase Realtime (postgres_changes) is the equivalent of `useLiveQuery`. It requires enabling replication on each table in the Supabase dashboard. For the initial integration, fetch-on-mount + refetch-after-mutation is safer and simpler; realtime can be layered on later.

### Multi-Device Sync
Once auth is in place, the same user can log in from multiple devices and all data syncs automatically via Supabase. No extra work is needed beyond the RLS policies.

### Backup Feature
The AES-GCM encrypted backup (`lib/backup/local-backup.ts`) currently exports from Dexie. After migration it will export from Supabase queries. The encryption logic itself does not change.
