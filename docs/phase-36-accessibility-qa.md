# Phase 36 accessibility QA

Phase 36 strengthens the accessibility work already delivered in Phase 15 and records the checks required before release.

## Keyboard and dialog behavior

- The skip link reaches the main content before the navigation.
- All interactive controls retain a visible focus indicator, including the receipt file picker.
- Opening a receipt sends focus to its Close button.
- Tab and Shift+Tab stay within the receipt viewer; Escape and an overlay click close it.
- Closing a receipt returns focus to the Receipt button that opened it.

## Screen-reader and language checks

- The viewer has a labelled, modal dialog role and a short instruction describing Escape.
- Transaction, form, status, and image text are exposed with labels or accessible names.
- English and Urdu retain semantic headings and controls. Urdu continues to use the application RTL direction setting.

## Visual and motion checks

- Focus remains visible in normal and Windows forced-colors modes.
- The existing reduced-motion rule disables nonessential animation, transition, and smooth scrolling. The receipt viewer also removes its backdrop blur for reduced-motion users.
- Responsive layout should be checked at 320 px, 768 px, and 1280 px widths before each production release.
