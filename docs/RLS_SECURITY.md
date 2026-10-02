# Row Level Security (RLS) Policies

All 7 tables have RLS enabled. Every policy uses `auth.uid() = user_id` — a user
can only read, write, update, or delete their own rows.

## Policy summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | own row | own row | own row | own row |
| `app_settings` | own row | own row | own row | own row |
| `attendance_records` | own rows | own rows | own rows | own rows |
| `company_loans` | own rows | own rows | own rows | own rows |
| `company_transactions` | own rows | own rows | own rows | own rows |
| `savings_goals` | own rows | own rows | own rows | own rows |
| `pocket_transactions` | own rows | own rows | own rows | own rows |
| `career_records` | own rows | own rows | own rows | own rows |

## How ownership is enforced

Every table has a `user_id UUID NOT NULL REFERENCES auth.users(id)` column.

Policies use:
```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

`auth.uid()` is resolved by Supabase from the JWT in the request — it cannot
be spoofed by client-side code.

## What is NOT in Supabase

`SecuritySettings` (PIN hash, PIN salt, passkey credential ID) is intentionally
kept in IndexedDB only (`use-security-settings.ts` still uses Dexie). Cryptographic
secrets must never leave the device.

## Security notes

- The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key) is safe for browser use.
  It is scoped to authenticated users via RLS — an unauthenticated caller gets
  nothing because no public SELECT policies exist.
- The `service_role` key is never used in application code.
- No `true` or unrestricted policies exist on any table.
