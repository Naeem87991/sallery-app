# Phase 37 performance and offline-resilience QA

## Delivery improvements

- All application routes remain statically prerendered, as confirmed by the production build.
- The service worker now precaches the smallest reliable application shell: the home route, offline fallback, web-app manifest, and icon.
- Successful visited navigations are stored with a network-first strategy. An offline revisit uses the saved route, then the saved home shell, then the dedicated offline page.
- Same-origin Next static chunks, fonts, and image assets use a cache-first strategy after their first online request. This keeps previously visited screens usable when connectivity drops.
- The worker uses a versioned cache, removes older cache versions on activation, and is registered with cache-bypassing update checks. Its response is explicitly non-cacheable, so production updates are detected promptly.

## Regression checks

- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before release.
- In a production build, open the home page and each core route while online; then use browser DevTools to switch offline and revisit a previously opened route. Verify the local Dexie records remain visible.
- In DevTools Application storage, verify the active `live-salary-ticker-shell-v2` cache includes the app shell and that old `live-salary-ticker-shell-*` caches are removed after activation.
- Confirm a fresh offline visit falls back to `/offline` when neither its route nor the home shell is available.

## Known test limitation

The local browser-automation surface was unavailable during this phase, so the final network-toggle smoke test remains a release checklist item for a browser with DevTools. The production build and service-worker source policy were verified locally.
