# Phase 04 — Architecture Decision Record

## ADR-001: Offline-first, device-local application

**Status:** Accepted

The application is a Next.js App Router PWA whose normal user data resides in the current browser/device. It does not require an application backend for salary, attendance, ledgers, or reports.

**Consequences:** The application remains useful offline and does not transmit financial records by default. Data is not automatically synchronized across devices; recovery depends on the user exporting encrypted backups.

## ADR-002: IndexedDB through Dexie is the source of truth

**Status:** Accepted

Dexie manages the versioned `live-salary-ticker` IndexedDB database. Domain records are typed in `types/domain.ts`; database schema versions are declared in `lib/database/database.ts`.

**Consequences:** Persisted schema changes require a Dexie migration/version update and restore validation. Lightweight browser-session state is allowed only for the local unlock session, not for financial records.

## ADR-003: Balances are derived from immutable-style ledger records

**Status:** Accepted

Company and pocket balances are calculated from transaction records. Current salary and historical career earnings are separate calculation domains.

**Consequences:** A displayed balance is reproducible and auditable. New balance-affecting features must define their transaction direction in the financial-rule register; they must not add a mutable stored total.

## ADR-003a: Loans use a linked principal record and repayment ledger entries

**Status:** Accepted

Each tracked company loan has its own local record. Issuing it creates a linked company-loan debit; each repayment is a linked company credit. Outstanding principal is derived from the linked repayments, never stored as a mutable balance.

**Consequences:** A repayment cannot exceed the remaining principal. Removing an issued tracked loan removes its linked repayments to prevent orphaned ledger records. Legacy unlinked `loan` entries remain valid historical company ledger entries but do not acquire a repayment schedule automatically.

## ADR-004: Validate at every persistence and restore boundary

**Status:** Accepted

Domain validation runs before repository writes. Backup imports validate their envelope, schema, record shape, IDs, dates, and domain invariants before data can be replaced.

**Consequences:** UI validation is not treated as sufficient. Invalid legacy data is handled defensively by the calculation layer so it cannot render non-finite money values.

## ADR-005: Client-side protection is local protection, not account authentication

**Status:** Accepted

The optional PIN is PBKDF2-derived with a random salt; the optional passkey is a local WebAuthn shortcut. The unlock state lives only in the browser session. Backups exclude PIN salts, hashes, and passkey identifiers.

**Consequences:** This protects a device-local workspace from casual access but is not server-verified identity and cannot provide multi-device account recovery. Copy must not imply bank-grade or server-backed security.

## ADR-006: Portable backups are encrypted before download and explicitly restored

**Status:** Accepted

Backups use PBKDF2-SHA-256 with 210,000 iterations and AES-256-GCM in the browser. A restore first decrypts and previews record counts, then requires a user confirmation before replacement.

**Consequences:** The passphrase is never retained by the application. Restore remains a destructive operation and must retain confirmation and validation safeguards.

## ADR-007: Client-only boundaries protect browser APIs

**Status:** Accepted

Dexie, Web Crypto, WebAuthn, and browser storage modules are explicitly client-only. Interactive components run in Client Component boundaries; routing remains in the Next.js App Router.

**Consequences:** New modules that use `window`, `navigator`, IndexedDB, or browser crypto must preserve the client-only boundary. Secrets and server-only concerns must not enter client bundles.

## ADR-008: Production deployment uses Vercel’s Next.js support

**Status:** Accepted

The Vercel project is `naeem-8e55/sallery-app`; production deploys from the tracked repository using the native Next.js build output. No custom Vite `dist` directory is used.

**Consequences:** The project’s framework preset must remain Next.js, with the default output behavior. Deployment verification includes a successful `next build` and an HTTP response from the production domain.

## Open architecture decisions

- Whether future reminders need an operating-system notification permission and how they behave while the app is closed.
- Whether attachments/receipts are stored as encrypted blobs, file handles, or excluded from offline backup size limits.
- Whether cross-device sync is ever introduced; doing so would require a separate authentication, authorization, encryption, conflict-resolution, and privacy design.
