# Security Audit

## Secrets check

| Item | Status |
|---|---|
| `service_role` key in source code | ✅ Not present |
| Database password in source code | ✅ Not present |
| `.env.local` in `.gitignore` | ✅ Covered by `.env*` rule |
| `.env.local` in staged files | ✅ Not staged |
| Publishable key in browser code | ✅ Safe — this is the anon/publishable key, designed for browser use |
| RLS on all Supabase tables | ✅ All 8 tables — see RLS_SECURITY.md |
| All RLS policies use `auth.uid()` | ✅ Confirmed |
| No unrestricted `true` policies | ✅ Confirmed |
| PIN hash stored in Supabase | ✅ Not stored — stays in IndexedDB only |

## Known limitations

1. **Receipt images** — `PocketTransaction.receipt_data_url` stores raw base64 image
   data in a Postgres TEXT column. Valid for low volume but inefficient at scale.
   Future improvement: move receipts to Supabase Storage.

2. **No email confirmation enforced in dev** — Supabase email confirmation is
   optional by default. Enable it in production: Authentication → Providers → Email
   → "Confirm email".

3. **PIN lock is local only** — PIN/passkey lock is a second layer of local security.
   It does not prevent someone with the user's Supabase credentials from accessing
   the API directly. This is by design — the PIN is a screen-lock, not an
   authentication mechanism.

4. **Dexie still imported for security settings** — `lib/database/database.ts` and
   `dexie` packages remain because `use-security-settings.ts` uses IndexedDB.
   This is intentional. Dead Dexie code in other files poses no security risk.
