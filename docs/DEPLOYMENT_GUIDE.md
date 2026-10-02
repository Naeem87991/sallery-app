# Deployment Guide — Live Salary Ticker + Supabase

## Step 1 — Supabase Setup

### 1a. Run migrations
Go to: https://supabase.com/dashboard/project/prnesoolelavpqjoshhv/sql/new

Run each file in order (copy → paste → Run):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_row_level_security.sql`
3. `supabase/migrations/003_updated_at_trigger.sql`

### 1b. Enable Email Auth
Go to: Authentication → Providers → Email
- Enable Email provider
- (Optional) Disable "Confirm email" for development; **enable it for production**

### 1c. Set Site URL
Go to: Authentication → URL Configuration
- Site URL: `https://sallery-app.vercel.app`
- Redirect URLs: add `https://sallery-app.vercel.app/auth/callback`

---

## Step 2 — Vercel Environment Variables

Go to: https://vercel.com/naeem-8e55/sallery-app/settings/environment-variables

Add these two variables (all environments):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://prnesoolelavpqjoshhv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_yHxK5Rt7v4t4ACpJFk2tQg_CAquRNue` |

Then trigger a redeploy: Deployments → Redeploy latest.

---

## Step 3 — Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app reads `.env.local` automatically. Supabase env vars are already in that file.

---

## Step 4 — Push to GitHub

```bash
git add proxy.ts app/login/ app/auth/ app/logout/ lib/supabase/ hooks/ \
  components/onboarding/onboarding-wizard.tsx \
  components/settings/settings-content.tsx \
  components/company/company-content.tsx \
  components/pocket/pocket-content.tsx \
  components/attendance/attendance-content.tsx \
  components/career/career-content.tsx \
  supabase/ docs/ next.config.ts app/layout.tsx .env.example package.json package-lock.json

git commit -m "feat: integrate Supabase backend — multi-user auth, cloud DB, RLS, replace Dexie"
git push origin main
```

Vercel auto-deploys on push to `main`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Redirected to `/login` after deploy | Add Supabase env vars to Vercel and redeploy |
| `connect-src` CSP error in console | Already fixed in `next.config.ts` — redeploy |
| "Invalid login credentials" | Email/password wrong, or email not confirmed |
| RLS policy error in Supabase logs | Confirm migrations 001 and 002 ran successfully |
| Auth callback 404 | Check `app/auth/callback/route.ts` exists and Vercel redeployed |
| Session not persisting | Ensure `proxy.ts` (not `middleware.ts`) is at project root |
| Supabase URL not found | Confirm `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel env vars |
