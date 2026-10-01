# Phase 39 end-to-end and failure-case QA

The Playwright suite runs against the production Next.js build and uses a new browser context for each scenario, isolating local IndexedDB data.

## Automated browser workflows

- Incomplete onboarding is rejected; a completed local workspace survives a full-page refresh.
- A pocket cash entry, savings goal, and linked savings transfer persist after refresh.
- Encrypted backup export, decrypt/preview, acknowledgement, typed `REPLACE` safeguard, and restore run as one user workflow. Incorrect typed confirmation keeps replacement disabled.
- Local PIN protection rejects an invalid PIN after a fresh session and unlocks only with the saved PIN.

## Commands

- `npm run build && npm run test:e2e` runs the browser suite against the production application.
- `npm run test:all` runs the existing Vitest suite and the Playwright suite; run `npm run build` first.

Playwright failure screenshots and traces are test artifacts only and are not committed.

Service workers are blocked only within the browser test context so a stale cache cannot
affect a build under test. Offline service-worker behavior remains covered by the Phase 37
quality checks.
