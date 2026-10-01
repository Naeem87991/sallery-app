# Phase 40 — Operations, recovery, and deployment

This guide is for the person operating or releasing Live Salary Ticker. It documents the current offline-first behavior; it is not a substitute for a server-side backup or account-recovery system, because the application intentionally has neither.

## Operating model

- Financial and profile data stays in the `live-salary-ticker` IndexedDB database for the current browser profile and origin.
- The PWA service worker caches application assets for offline use. It is not the database and it does not synchronize business data.
- A browser profile, device, or origin is a separate workspace unless an encrypted backup is exported and restored there.
- Local PIN and passkey settings protect the workspace on one device. They do not create an account and are excluded from portable backups.

### Data included in an encrypted backup

| Included | Not included |
| --- | --- |
| Profile, salary settings, and app preferences | PIN hash and salt |
| Attendance, company entries, and tracked loans | Local passkey credential identifier |
| Pocket entries, embedded receipt images, and savings goals | Browser session unlock state |
| Career history | Service-worker/cache contents |

## Backup and recovery runbook

### Export a recovery copy

1. Open **Settings → Encrypted backup and restore** while the intended local workspace is available.
2. In **Export backup**, enter and confirm a unique passphrase of at least eight characters.
3. Choose **Download encrypted backup** and retain the resulting `.lstbackup` file.
4. Store the file in a protected location and the passphrase separately (for example, a password manager). Do not put the passphrase in the same unprotected folder, message, or email as the backup.
5. Export a fresh copy before browser cleanup, a device move, a major data change, or a destructive restore. A practical cadence is after each pay cycle and before significant ledger changes.

The backup is encrypted with AES-256-GCM. Its key is derived in the browser with PBKDF2-SHA-256 and 210,000 iterations. The passphrase is never retained by the app, so a forgotten passphrase cannot be reset or recovered.

### Restore onto this browser or a replacement device

1. If any local records are visible, first export them as a rollback backup. Restore replaces the current business records.
2. Open **Settings → Encrypted backup and restore**. On a new device, complete onboarding first so Settings is available.
3. In **Restore backup**, choose the `.lstbackup` file, enter its export passphrase, then select **Decrypt and preview**.
4. Review the backup date, schema version, and all record counts. Stop if they are not the expected workspace.
5. Check the acknowledgement, type the uppercase word `REPLACE`, and choose **Replace local data with this backup**.
6. Confirm the success message, then visit Home, Company, Pocket, and Attendance to spot-check the restored records.
7. Reconfigure the local PIN and optional passkey if needed. They are intentionally not restored from a backup.

The restore process rejects an incorrect passphrase, malformed/encrypted corruption, unsupported newer backup schema, duplicate IDs, invalid record shapes, and broken loan/goal references before it can replace local records. If it reports that the backup could not be restored, the existing local data remains in place.

### Roll back a mistaken restore

Restore the rollback backup made in step 1 using the same preview, acknowledgement, and `REPLACE` workflow. If no pre-restore backup exists, the replaced local records cannot be recovered by this app.

### Browser cleanup and lost-device response

Before clearing cookies, site data, IndexedDB, or a browser profile, export an encrypted backup. Clearing site data removes the local workspace. Uninstalling the PWA, deleting a browser profile, switching browsers, or using private/incognito mode can likewise make local records unavailable.

If the device is lost, the remote deployment does not contain the device's local financial data. Use a separately stored backup on a replacement device. If the device was signed into a browser account, follow that browser/platform's own device-security and account-revocation procedure; this application has no remote session to revoke.

### PIN and passkey recovery limits

There is no PIN-reset or server-side account-recovery path. Do not clear site data merely to solve a forgotten PIN: it also deletes the local records. The safe preventative measure is an up-to-date encrypted backup whose passphrase is available. A passkey is only a compatible-device shortcut, not a recoverable cloud account credential.

## Deployment and troubleshooting

### Vercel release procedure

1. Verify the working tree contains only intended changes and run:

   ```bash
   npm ci
   npm run lint
   npm run typecheck
   npm run build
   npm run test:e2e
   ```

2. Push the reviewed commit to the GitHub repository connected to Vercel.
3. In Vercel, use the **Next.js** framework preset, repository root as the root directory, and the default `npm run build` command. The current local-only app needs no deployment environment variables.
4. Let the production deployment finish, then test the deployed URL in a normal browser profile: onboarding, a small local ledger entry, backup export, and an offline reload after the initial visit.
5. Keep a backup from the deployment smoke-test browser before clearing that browser's local test records.

### Troubleshooting table

| Symptom | Safe checks and resolution |
| --- | --- |
| `npm run build` fails | Run `npm ci`, then rerun lint and typecheck. Do not change the Vercel build output to a Vite `dist` directory; this is a Next.js application. |
| Playwright cannot start | Run `npm run build` first. The E2E config starts `npm run start` on port 3012 and tests the production build. Install Chromium once with `npx playwright install chromium` if Playwright reports that its browser is missing. |
| A deployed page looks stale | Close duplicate tabs and reload once. If the old service worker remains in DevTools, unregister it and reload; that clears cached app assets, not IndexedDB. Export records before using any browser command labelled **Clear site data**. |
| Offline reload fails after a first successful visit | Confirm the deployment loaded normally while online, then reload once online so the service worker can cache the app shell. Check that `/sw.js` returns successfully and is served with the configured no-cache headers. |
| Restore preview fails | Verify the exact passphrase and that the selected file is the original `.lstbackup`. A bad passphrase, modified file, unsupported newer format, or invalid record relation is intentionally rejected. Existing records stay untouched. |
| Values are missing after changing browser/device | This is expected for device-local IndexedDB. Restore a previously exported encrypted backup; there is no automatic cross-device sync. |
| PIN cannot be remembered | Use the configured local passkey if available. Otherwise there is no reset route that preserves this browser's local workspace; use an encrypted backup on a clean/replacement workspace. |

## Change and release guardrails

- Treat backups as a compatibility contract. A persisted-domain change requires database migration, backup validation/migration behavior, financial-rule review where relevant, and test coverage.
- Do not introduce a stored mutable balance; keep new balance features ledger-derived.
- Do not add a server secret, a financial record, or a backup passphrase to client-delivered environment variables.
- Re-run the Phase 36–39 QA checks after a change that touches accessibility, offline caching, security/restore behavior, or end-to-end workflows.
- Update the requirements traceability matrix and this guide whenever data ownership, restore behavior, deployment behavior, or the operational recovery path changes.
