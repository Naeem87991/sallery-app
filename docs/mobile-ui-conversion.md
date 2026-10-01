# Mobile-First UI Conversion

## Summary

This document records all changes made during the mobile-first UI conversion of the Live Salary Ticker app. The goal was to improve the mobile experience by extracting inline mobile components into standalone files and adding a consistent card/grid system, while leaving all business logic, data fetching, state management, salary calculations, routing, and authentication completely untouched.

---

## New Files Created

### `components/layout/mobile-bottom-nav.tsx`
A standalone `'use client'` component that renders the bottom navigation bar on mobile. Uses the new `.mobile-bottom-nav` and `.mobile-bottom-nav-item` CSS classes. Accepts `activePage`, `pathname`, and `language` props. The primary navigation data is declared locally to avoid creating a new shared module. Hidden on desktop via `@media (min-width: 900px)`.

### `components/layout/mobile-header.tsx`
A standalone `'use client'` component that renders the sticky mobile header: a compact brand mark link and a privacy toggle icon button. Accepts `financialsVisible`, `language`, and `onToggleVisibility` props. Hidden on desktop via existing CSS media query.

---

## Modified Files

### `app/globals.css`

**Patched existing rules:**
- `.mobile-header` — changed height from `72px` to `56px`, added `position: sticky`, `top: 0`, `z-index: 90`, `background: var(--canvas)`, `border-bottom: 1px solid var(--line)`, and adjusted padding to `0 16px`.
- `.page-content` — updated `padding-bottom` from `104px` to `calc(72px + env(safe-area-inset-bottom, 16px))` for safe-area support on iOS devices.
- `button { font: inherit; }` — followed immediately by a new global touch-target rule: `button, a, [role="button"] { min-height: 44px; }`. Existing specific overrides (`.icon-button`, `.primary-button`, etc.) maintain their heights via normal cascade specificity.

**New classes appended:**
- `.mobile-bottom-nav` — fixed bottom nav container using `var(--panel-solid)` background and backdrop-filter; hidden at 900px+.
- `.mobile-bottom-nav-item` — flex column item for each nav link; active state uses `var(--accent)` color and SVG drop-shadow.
- `.cards-grid` — 2-column grid on mobile (gap 10px), 4-column at 900px+ (gap 16px). Responsive gap at 430px+.
- `.card` — `border-radius: 16px; padding: 14px 16px` utility class for consistent card appearance.
- `.earnings-amount` — `font-size: clamp(1.75rem, 8vw, 3rem)` responsive typography for the main earnings display.
- `.mobile-only` / `.desktop-only` — visibility helpers for conditional rendering by breakpoint.

### `components/layout/app-shell.tsx`
- Added imports for `MobileBottomNav` and `MobileHeader`.
- Replaced the inline `<header className="mobile-header">` block with `<MobileHeader ... />`.
- Replaced the inline `<nav className="bottom-navigation">` block with `<MobileBottomNav ... />`.
- The desktop sidebar, `Brand`, `NavLink`, and `Navigation` helper functions are unchanged.

### `components/dashboard/dashboard-content.tsx`
- Added `cards-grid` class to `.overview-grid` section: `className="overview-grid cards-grid"`.
- Added `card` class to all 4 metric card elements: `className="metric-card metric-card-link card"` (links) and `className="metric-card card"` (articles).
- Added `earnings-amount` class to the ticker amount div: `className="ticker-amount earnings-amount"`.

### `components/attendance/attendance-content.tsx`
- Added `cards-grid` class to `.attendance-summary` div: `className="attendance-summary cards-grid"`.
- Added `card` class to each summary `<article>` via the `SummaryCard` helper function: `className="card"`.

### `components/company/company-content.tsx`
- Added `cards-grid` class to `.company-summary` div: `className="company-summary cards-grid"`.
- Added `card` class to each summary `<article>` via the `SummaryCard` helper function: `className="card"`.

### `components/reports/reports-content.tsx`
- Added `cards-grid` class to `.reports-overview` section: `className="reports-overview cards-grid"`.
- Added `card` class to each `ReportMetric` article: `className="card"`.

---

## Files Not Changed

- `components/pocket/pocket-content.tsx` — no summary grid cards; existing layout is already mobile-compatible.
- `components/settings/settings-content.tsx` — `.switch-row` already has `min-height: 56px`; `.field input`/`.field select` already have `min-height: 44px`. No changes needed.

---

## CSS Token Reference

All new CSS uses only tokens already defined in `:root` (and their light-theme overrides via `.app-shell-light`):

| Token | Dark value | Use |
|---|---|---|
| `--canvas` | `#07110f` | Page/header background |
| `--canvas-deep` | `#040806` | HTML background |
| `--panel` | `rgba(16, 32, 24, 0.72)` | Semi-transparent panel |
| `--panel-solid` | `#102118` | Bottom nav background (no backdrop-filter fallback) |
| `--ink` | `#f1f8ef` | Primary text |
| `--muted` | `#8fa293` | Secondary text / inactive nav items |
| `--line` | `rgba(225, 248, 227, 0.1)` | Borders/dividers |
| `--accent` | `#b6ff45` | Active nav item / highlight |
| `--accent-strong` | `#7de553` | Stronger accent |
| `--accent-dark` | `#1b351c` | Dark accent background |
| `--warning` | `#ffbb5c` | Warning states |
| `--shadow` | `0 18px 60px rgba(0,0,0,0.28)` | Box shadows |

No new CSS custom properties were introduced.

---

## Constraints Respected

- No changes to: `lib/calculations/`, `lib/database/`, `lib/backup/`, `lib/security/`, `lib/validation/`, `lib/attendance/`
- No new npm packages introduced
- No business logic, data fetching, or state management changes
- No new CSS custom properties
- No hardcoded color values in new CSS — all use `var()` references
- Desktop sidebar remains fully functional at 900px+ (CSS handles show/hide)
- E2E test selectors use `aria-label`, `role`, and text — not CSS class selectors — so renaming `.bottom-navigation` to `.mobile-bottom-nav` does not break any tests
