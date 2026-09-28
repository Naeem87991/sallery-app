# Live Salary Ticker

An offline-first, mobile-focused salary and personal-finance workspace. It runs as a Next.js PWA and stores normal application data in IndexedDB on the current device.

## Features

- Live salary ticker with fixed-monthly and daily-rate rules
- Attendance calendar with optional on-device auto-attendance, plus a local company ledger
- Personal pocket, Udhaar entries, savings goals, and career history
- Client-side PDF, CSV, and voucher-image exports
- Encrypted local backup and previewed restore
- Privacy mode, local PIN lock, and optional device passkey shortcut

## Stack

Next.js App Router, TypeScript, React, Dexie/IndexedDB, Web Crypto API, and `pdf-lib`.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Data and financial rules

The current live salary engine, company balance, and personal-pocket balance use centralized calculation modules under `lib/calculations`. Historical career records remain separate from current live finances. Ledger screens derive their balances from saved transaction records rather than overwriting a stored balance.

The default monthly daily-rate rule is monthly salary divided by 30. Settings also support 26-working-day and calendar-day rules. Paid weekly offs and half-day factors remain configurable in local settings.

Optional auto-attendance runs while the workspace is open or when it returns to the foreground. It records only the latest eligible blank day and never replaces a manual attendance entry.

## Local security and backups

App records live in IndexedDB. Backups are exported as encrypted `.lstbackup` files using PBKDF2 (SHA-256, 210,000 iterations) and AES-256-GCM in the browser. The passphrase is never stored in the application.

Importing a backup first decrypts and validates its schema and record collections, then shows a record-count preview. The user must explicitly confirm before the current local finance data is replaced. PIN hashes, salts, and local passkey identifiers are intentionally not part of backups, so security stays device-specific.

The optional app PIN is stored only as a PBKDF2 hash plus a random salt. A compatible browser can add a local passkey shortcut after a PIN is configured. Because this app has no backend, passkeys are a device-local unlock convenience rather than server-verified identity.

## Project layout

- `app/` — App Router pages and global styles
- `components/` — mobile-first feature UI
- `hooks/` — live IndexedDB queries
- `lib/calculations/` — financial rules and derived balances
- `lib/database/` — Dexie schema and repository actions
- `lib/backup/` and `lib/security/` — encrypted backups and local app lock
- `types/` — shared domain entities
