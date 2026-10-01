# Live Salary Ticker

Live Salary Ticker is an offline-first, mobile-focused salary and personal-finance workspace. It is a Next.js PWA that keeps normal application records in the current browser's IndexedDB database; it does not use an application backend or automatically synchronize records between devices.

## What it does

- Tracks live salary under fixed-monthly or daily-rate rules.
- Records attendance, company credits/debits, tracked loan repayments, pocket cash, Udhaar, and savings goals.
- Keeps career-history earnings separate from the current workspace.
- Exports client-side PDF, CSV, and voucher-image reports.
- Exports encrypted local backups and requires a reviewed, typed confirmation before restore.
- Supports English and Urdu, RTL layouts, privacy mode, a local PIN lock, and an optional local passkey shortcut.

## Run it locally

Install the locked dependencies, then use the command that matches the task:

```bash
npm ci
npm run dev                  # development server
npm run lint                 # ESLint
npm run typecheck            # TypeScript without emitting files
npm test                     # Vitest unit/regression suite
npm run build                # optimized production build
npm run test:e2e             # Playwright against the already-built production app
npm run test:all             # unit + Playwright tests; run npm run build first
npm run start -- --port 3000 # serve the built production app
```

There are no required environment variables for the current local-only application. Do not place credentials or backup passphrases in `NEXT_PUBLIC_*` variables: those values are included in browser-delivered code.

## Financial rules at a glance

All amounts are PKR. Calculations retain finite fractional values internally; most currency cards display rounded whole PKR, while the live ticker displays two decimals.

| Area | Formula / rule | Example |
| --- | --- | --- |
| Fixed-monthly daily rate | `base monthly salary ÷ selected divisor` | PKR 60,000 ÷ 30 = PKR 2,000 per day. The other divisors are 26 working days or the current calendar month's day count. |
| Daily-rate mode | The entered positive daily rate is used directly. | PKR 2,200 daily stays PKR 2,200. |
| Live shift earning | During an eligible shift: `min(daily rate, elapsed time ÷ configured shift duration × daily rate)`. Before the shift it is 0; after it, it is the full daily rate. | PKR 2,000, 8-hour shift, 2 hours elapsed = PKR 500. |
| Weekly off | A paid weekly off earns one daily rate; an unpaid one earns zero. | A paid Friday off with a PKR 2,000 daily rate earns PKR 2,000. |
| Company balance | `credits + loan repayments − withdrawals − vouchers − advances − loans − deductions` | PKR 10,000 credit and PKR 1,200 voucher = PKR 8,800. |
| Loan outstanding | `max(0, principal − linked repayments)` | PKR 12,000 principal and PKR 4,500 repaid = PKR 7,500 outstanding. |
| Pocket balance | `cash-in + receipts + Udhaar received − expenses − Udhaar given − savings transfers out` | PKR 3,000 cash-in and PKR 800 expense = PKR 2,200. |
| Savings goal | A goal's saved amount is updated by a linked transfer; a goal itself is not a pocket entry. | A PKR 300 transfer out adds PKR 300 to its selected goal. |
| Career history | `monthly salary ÷ 30 × inclusive calendar days` | PKR 30,000 for 10 inclusive days = PKR 10,000. |

See the [financial-rule register](docs/phase-03-financial-rule-register.md) for accepted rules, edge cases, and change control.

## Local data, safety, and recovery

The `live-salary-ticker` IndexedDB database contains one current profile, salary settings, app preferences, attendance, company transactions/loans, pocket transactions (including locally stored receipt images), savings goals, career records, and device-local security settings. Balances are derived from ledger records; a mutable balance is never treated as the source of truth.

Use **Settings → Encrypted backup and restore** before changing browsers, clearing browser data, replacing a device, or performing a restore. A backup contains the business records listed above except PIN hashes/salts and passkey identifiers. Those security settings deliberately remain device-specific.

Backups are portable `.lstbackup` files encrypted in the browser with PBKDF2-SHA-256 (210,000 iterations) and AES-256-GCM. The passphrase must be at least eight characters and is never stored by the app. Keep the backup and its passphrase separately; losing either means the app cannot recover that backup.

For the complete export, restore, rollback, and incident procedure, see the [backup recovery runbook](docs/phase-40-operations.md#backup-and-recovery-runbook).

## Deploy to Vercel

The project uses Vercel's native Next.js support. Import the GitHub repository into the `naeem-8e55/sallery-app` Vercel project (or connect the existing project), leave the framework preset as **Next.js**, and use the repository root as the root directory. Vercel's default `npm run build` build command is correct; no custom Vite output directory is required.

Before promoting a production deployment, run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` locally. After deployment, load the home page, complete a short local-data and backup smoke test, and confirm the app can be opened after an offline reload. The [deployment and troubleshooting guide](docs/phase-40-operations.md#deployment-and-troubleshooting) has the detailed checklist and recovery-safe troubleshooting steps.

## Project layout

- `app/` — App Router pages, metadata, global styles, and service-worker route
- `components/` — responsive feature UI and local security/backup controls
- `hooks/` — live IndexedDB queries
- `lib/calculations/` — salary, company, pocket, and career derived values
- `lib/database/` — Dexie schema and repository actions
- `lib/backup/` and `lib/security/` — encrypted backup, local PIN, passkey, and session lock
- `e2e/` — production-build Playwright workflows
- `types/` — shared domain entities

## Product documentation

- [Requirements traceability](docs/phase-02-requirements-traceability.md)
- [Financial-rule register](docs/phase-03-financial-rule-register.md)
- [Architecture decision record](docs/phase-04-architecture-decision-record.md)
- [Accessibility QA](docs/phase-36-accessibility-qa.md)
- [Offline/performance QA](docs/phase-37-performance-offline-qa.md)
- [Security QA](docs/phase-38-security-qa.md)
- [End-to-end QA](docs/phase-39-e2e-qa.md)
- [Operations, recovery, and deployment](docs/phase-40-operations.md)
