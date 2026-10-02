# Supabase Integration — Implementation Summary

## Architecture change

**Before:** Single-user, offline-first, all data in IndexedDB via Dexie.

**After:** Multi-user, cloud-first, all data in Supabase PostgreSQL.
Each user signs in with email + password and sees only their own data (RLS).

---

## Database tables created

| Table | Purpose |
|---|---|
| `profiles` | UserProfile + SalarySettings merged — one row per user |
| `app_settings` | Theme, language, privacy mode — one row per user |
| `attendance_records` | One record per calendar day per user |
| `company_loans` | Named loans with principal amount |
| `company_transactions` | Company ledger entries (credits, deductions, loans, repayments) |
| `savings_goals` | Named savings targets with current saved amount |
| `pocket_transactions` | Personal cash movements, receipts, Udhaar, savings transfers |
| `career_records` | Past employment history |

All tables: UUID PKs, `user_id` FK to `auth.users`, `created_at`, `updated_at`, RLS enabled.

---

## Authentication

- Supabase Auth with email + password
- Sign-in / sign-up at `/login` (matches existing dark green theme)
- Auth callback at `/auth/callback` for email confirmation links
- Sign-out via POST `/logout`
- `proxy.ts` at root refreshes the session cookie on every request and redirects
  unauthenticated users to `/login`
- PIN lock preserved as a second local security layer (not replaced)

---

## Files created

| File | Purpose |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/supabase/middleware-client.ts` | Middleware session refresh helper |
| `lib/supabase/database.types.ts` | TypeScript types for all 8 tables |
| `lib/supabase/repository.ts` | All CRUD functions (returns `{data, error}`) |
| `proxy.ts` | Next.js 16 proxy (session refresh + auth guard) |
| `app/login/page.tsx` | Login / signup page |
| `app/auth/callback/route.ts` | Auth code exchange handler |
| `app/logout/route.ts` | Sign-out route |
| `hooks/use-auth.ts` | `useAuth()` hook — exposes `user`, `userId`, `isLoading` |
| `supabase/migrations/001_initial_schema.sql` | All table definitions |
| `supabase/migrations/002_row_level_security.sql` | All RLS policies |
| `supabase/migrations/003_updated_at_trigger.sql` | Auto-update `updated_at` trigger |
| `.env.example` | Safe template for env vars |
| `docs/SUPABASE_AUDIT.md` | Pre-implementation audit |
| `docs/DATABASE_SCHEMA.md` | Schema reference |
| `docs/RLS_SECURITY.md` | RLS policy documentation |
| `docs/SECURITY_AUDIT.md` | Security review |
| `docs/DEPLOYMENT_GUIDE.md` | Step-by-step deployment guide |

## Files modified

| File | What changed |
|---|---|
| All 7 hooks in `hooks/` | Replaced `useLiveQuery` (Dexie) with Supabase fetch + `useEffect` |
| `hooks/use-security-settings.ts` | Kept on Dexie intentionally (PIN hash stays local) |
| `components/onboarding/onboarding-wizard.tsx` | Writes to Supabase `upsertProfile` + `upsertAppSettings` |
| `components/settings/settings-content.tsx` | Saves to Supabase; calls `refetch()` after save |
| `components/company/company-content.tsx` | All writes use `lib/supabase/repository` |
| `components/pocket/pocket-content.tsx` | All writes use `lib/supabase/repository` |
| `components/attendance/attendance-content.tsx` | All writes use `lib/supabase/repository` |
| `components/career/career-content.tsx` | All writes use `lib/supabase/repository` |
| `next.config.ts` | Added Supabase URLs to `connect-src` CSP |
| `app/layout.tsx` | Updated description |
| `.env.local` | Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `app/globals.css` | Calendar redesign (new status chips, today highlight, status tints) |

---

## What was NOT changed

- All salary/attendance calculation logic (`lib/calculations/`)
- PIN lock and passkey (`lib/security/`, `components/security/`)
- PDF/CSV export (`lib/reports/`)
- Backup/restore (`lib/backup/`) — still exports from Supabase queries
- i18n / translations (`lib/i18n/`)
- All UI components not related to data writes

---

## Live ticker

The live salary ticker remains 100% client-side. Salary settings are fetched from
Supabase once on mount, then all per-second calculations run locally in React state.
No database query occurs during the ticker animation loop.

---

## Remaining manual steps

1. **Run migrations** in Supabase SQL Editor (3 files, in order)
2. **Enable email auth** in Supabase Authentication settings
3. **Add env vars** to Vercel dashboard
4. **Redeploy** on Vercel after adding env vars

See `docs/DEPLOYMENT_GUIDE.md` for exact steps.
