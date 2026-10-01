# Phase 41 — Cross-device Responsive Visual Polish

## Overview

Phase 41 audited every screen in the application against three criteria:
1. **Touch target compliance** — every interactive element ≥ 44 × 44 px on mobile (WCAG 2.5.5)
2. **Responsive layout integrity** — content readable and usable at 320 px, 375 px, 600 px, and 900 px+ viewports
3. **RTL correctness** — Urdu mode renders directional UI (arrows, grid column order, gradient masks) correctly
4. **Color token compliance** — no hardcoded values that fail in light mode

All fixes are in `app/globals.css` and one TSX file. No logic, schema, or security code was touched.

---

## Screen audit and changes

### `app/page.tsx` (Dashboard)

**Audited**: ticker card, overview grid, action strips, metric cards, bottom nav.

**Changes**:
- `.ticker-amount` color changed from `#efffd0` (dark-theme only) to `var(--ink)` — fixes readability in light mode
- `.action-strip > div` — added `min-width: 0; flex-shrink: 1` to prevent Urdu headings from forcing horizontal scroll; `.action-strip .primary-button` gets `flex-shrink: 0`
- `.icon-button` size changed from `40×40` to `44×44` px on mobile (restored to `40×40` at 900px+)
- `.ticker-card::after` mask gradient — RTL override added: `270deg` instead of `90deg` so the grid fades right-to-left in Urdu mode

### `app/onboarding/page.tsx` (Onboarding wizard)

**Audited**: wizard steps indicator, wizard intro, form cards, navigation buttons.

**Changes**:
- `.wizard-shell` `margin` normalized from `12px auto 0` to `0 auto` — page-content top padding (increased to 16px, see layout) already provides adequate spacing
- `.wizard-step` RTL column order fixed — `[dir="rtl"]` rule added: `grid-template-columns: minmax(0,1fr) 23px` and the circle `span` gets `order: 2`, placing the step number on the right in Urdu mode
- `.secondary-button` `min-height` raised from `40px` to `44px` on mobile

### `app/attendance/page.tsx` (Attendance)

**Audited**: summary cards, calendar grid, day buttons, filter bar, bulk-action strip, attendance editor.

**Changes**:
- `.calendar-day, .calendar-blank` — added `min-height: 44px` on mobile (removed at 900px+) to meet WCAG touch target height
- `.attendance-bulk` — changed from horizontal flex to vertical stack on mobile (`flex-direction: column; align-items: flex-start`), restored to horizontal at 900px+
- `.attendance-workflow-actions` — `width: 100%; justify-content: flex-start` on mobile; `width: auto; justify-content: flex-end` at 900px+
- `.attendance-filter-bar .secondary-button` `min-height` raised from `38px` to `44px`
- Calendar navigation arrows — in `attendance-content.tsx`, the `←`/`→` characters are swapped when `isUrdu` is true so that clicking `→` goes to previous month and `←` goes to next month (matching RTL calendar semantics); `aria-label` attributes already correctly named the actions

### `app/company/page.tsx` (Company ledger)

**Audited**: balance card, transaction list, remove buttons, form layout.

**Changes**:
- `.company-balance-card strong` color: `#efffd0` → `var(--ink)`
- `.company-balance-card p:not(.eyebrow)` color: `#b0c3b0` → `var(--muted)`
- `.remove-button` — `padding: 0; margin-top: -6px` → `padding: 4px 8px; min-height: 44px; min-width: 44px; margin-top: 0; display: inline-flex; align-items: center; justify-content: center` (restored to no min-size at 900px+)
- `.attendance-summary small, .company-summary small` color: `#78907b` → `var(--muted)`
- RTL layout: `direction: rtl` added to `.app-shell[dir="rtl"] .company-layout` at 900px+, reversing column order so form is on the right and list on the left

### `app/pocket/page.tsx` (Pocket / Savings)

**Audited**: balance card, pocket alert, savings goals, transaction list.

**Changes**:
- `.pocket-balance-card strong` color: `#ddf4ff` → `var(--ink)`
- `.pocket-balance-card p:not(.eyebrow)` color: `#b0c8cb` → `var(--muted)`
- `.pocket-alert` — changed from `align-items: center` (no wrap) to `align-items: flex-start; flex-wrap: wrap` with `flex: 1 1 160px` on the text div; the secondary button gets `align-self: flex-start; flex-shrink: 0` — fixes layout on very narrow screens in Urdu
- RTL layout: `direction: rtl` added to `.app-shell[dir="rtl"] .pocket-layout` and `.app-shell[dir="rtl"] .savings-layout` at 900px+

### `app/career/page.tsx` (Career history)

**Audited**: hero card, stats grid, history list, remove buttons.

**Changes**:
- `.career-hero strong` color: `#efffd0` → `var(--ink)`
- `.career-hero p:not(.eyebrow)` color: `#a8c0ac` → `var(--muted)`
- `.career-history-list .remove-button` `margin-top: 2px` → `0` (touch target is handled by the shared `min-height: 44px`)
- RTL layout: `direction: rtl` added to `.app-shell[dir="rtl"] .career-layout` at 900px+

### `app/reports/page.tsx` (Reports)

**Audited**: overview stat cards, export grid, report-contents.

**Changes**:
- `.reports-overview` changed from `grid-template-columns: repeat(3, minmax(0, 1fr))` (always 3-col) to `grid-template-columns: 1fr` on mobile, with `repeat(3, minmax(0, 1fr))` restored at 900px+. At 320px the 3 stat cards were ~94px each, too narrow for PKR amounts.

### `app/settings/page.tsx` (Settings)

**Audited**: form sections, save bar, PIN panel, backup panel.

**Changes**:
- `.settings-save-bar` `bottom: 87px` → `bottom: calc(80px + env(safe-area-inset-bottom, 0px))` — fixes the save bar being obscured behind the bottom nav on iPhone 14/15 (dynamic island devices have `safe-area-inset-bottom` up to 34px, making the nav 106px tall)

### `components/layout/` and `app/layout.tsx`

**Audited**: mobile header, bottom navigation, desktop sidebar, page-content wrapper.

**Changes**:
- `.page-content` top padding `12px` → `16px` for slightly more breathing room below the header
- No other layout file changes were needed

---

## CSS token / global changes

- `overscroll-behavior: contain` added to `.company-transaction-list, .career-history-list, .savings-section, .report-contents, .attendance-calendar-section` (Phase 11 block) — prevents iOS rubber-band bleed on list containers
- `attendance-calendar-section` added to the `contain: paint` group

---

## Constraints honoured

- No financial calculation logic changed
- No database schema or migration code changed
- No security, PIN, or backup logic changed
- No new npm dependencies introduced
- All color replacements use existing tokens (`--ink`, `--muted`) from the `:root` / `.app-shell-light` blocks
- All spacing uses existing patterns (no new hardcoded px values outside what was already in use)
- All 17 unit tests pass; lint is clean; build exits 0

---

## Items requiring manual device testing

The following should be verified on physical devices or accurate simulators before release:

1. **iPhone 14 / 15 (Dynamic Island)** — settings save bar should float visibly above the bottom navigation bar with `safe-area-inset-bottom: 34px`
2. **320px viewport** — reports overview should stack 1-col; calendar day cells should be ≥ 44px tall; no horizontal scroll on any page
3. **Urdu mode — calendar navigation** — `→` button should advance to the previous month; `←` button to the next month (RTL semantics)
4. **Urdu mode — 900px+ viewport** — company, pocket, career, and savings layouts should show the form on the right and the list/history on the left
5. **Urdu mode — onboarding wizard** — step circles should appear on the right of each step label
6. **Light theme** — balance card amounts (company, pocket, career hero), ticker amount, and summary sub-labels should be dark and readable on the light `#dfeadd` canvas
7. **iOS Safari scroll containment** — scrolling the transaction or career history list to its end should not rubber-band the whole page

Content was rephrased for compliance with licensing restrictions.
