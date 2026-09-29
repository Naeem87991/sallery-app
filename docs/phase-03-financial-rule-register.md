# Phase 03 — Financial-Rule Register

## Purpose

This register is the single product-level reference for money, attendance, and related date rules. The code is authoritative for execution; a product rule must be added here before changing the code when it affects a calculation, stored amount, or automatic write.

## Current accepted rules

| Rule | Decision | Implementation / verification |
| --- | --- | --- |
| Currency | Current financial records are PKR only. | `SalarySettings.currency` is the literal `PKR`; validation rejects another value. |
| Fixed monthly daily rate | Default daily rate is base monthly salary divided by 30. | `calculateDailyRate()` with `30-days`. |
| Other salary divisors | 26-working-days and exact calendar-month days are selectable. | `SalaryCalculationRule` and `calculateDailyRate()`. |
| Daily-rate mode | A positive explicit daily rate is required; malformed legacy data yields zero derived earnings rather than `NaN` or infinity. | `assertSalaryRules()` and safe values in `earnings.ts`. |
| Live accrual | Earnings accrue linearly through the configured shift and never exceed the daily rate. | `calculateLiveEarnings()`. |
| Overnight shifts | If duty end is not after duty start, end is on the following local day. | `createShiftForDay()`. |
| Joining date | No earnings accrue for a shift before the local joining date. | `before-joining` earnings state. |
| Weekly off | The weekly-off weekday is configurable. A paid off day earns one daily rate; an unpaid off day earns zero. | `weeklyOffDay` and `isWeeklyOffPaid`. |
| Half day | The factor is configurable from greater than zero through one; default is 0.5. | `halfDayFactor` validation and attendance settings. |
| Attendance dates | All stored attendance dates are real local calendar dates (`YYYY-MM-DD`). | `isValidLocalDate()`. |
| Automatic attendance | Automation is off by default. When enabled, it considers only the latest eligible completed or triggered date, skips weekly offs and pre-joining dates, and never overwrites a saved record. | `getAutomaticAttendanceCandidate()` and `saveAutomaticAttendanceIfMissing()`. |
| Company balance | Credit adds to company balance. Withdrawal, voucher, advance, loan, and deduction subtract. | `getCompanyBalance()`. |
| Loan installments | A tracked loan has positive principal and an issue date. Its issuance is a linked company debit; repayments are linked company credits and cannot exceed outstanding principal. | `CompanyLoan`, `addCompanyLoanRepayment()`, and `getCompanyLoanSnapshots()`. |
| Pocket balance | Cash-in, receipt, and Udhaar received add. Expense and Udhaar given subtract. | `getPocketBalance()`. |
| Savings goals | Saved amount is non-negative and may not invalidate the positive target amount. A goal is not itself a pocket transaction. | `assertSavingsGoalInput()`. |
| Career earnings | Historical career earnings are calculated independently from current salary, company, and pocket values. | `career-earnings.ts`. |
| Data mutation | Financial balances are never saved as a separate mutable source of truth. They are derived from saved transaction records. | Calculation modules and repository design. |

## Controlled ambiguities and future decisions

| Topic | Current behavior | Decision needed before implementation |
| --- | --- | --- |
| Overtime pay | Overtime minutes are stored but do not increase live earnings. | Define rate multiplier, approval rule, and whether overtime is paid per day or per payroll cycle. |
| Leave pay | Leave is stored as attendance status, but there is no separate paid/unpaid leave balance engine. | Define leave entitlement, paid status, and carry-forward policy. |
| Loan interest and due schedule | Principal-only loans can be repaid in any number of manual installments. | Define optional interest, due dates, payroll deductions, and missed-payment behavior before adding them. |
| Salary deductions | A deduction subtracts from company balance. | Define whether deductions also reduce live/current salary and how payroll-period reconciliation works. |
| Pocket categories and transfers | Entries have a type and note only. | Define category taxonomy and whether transfers create linked double-entry records. |
| Reminder alerts | No reminder is generated locally. | Define timing, permissions, and whether notifications work only while the app is open. |
| Rounding | JavaScript calculations retain fractional PKR values internally. | Define display and export rounding (recommended: display two decimals; retain full precision only where required). |
| Time zone | Dates and shifts use the device’s local time zone. | Confirm whether records need a fixed Pakistan time zone when the device travels. |

## Change control

1. State the proposed rule, examples, and edge cases in a pull request or issue.
2. Update this register and the related validation/calculation test first.
3. Apply the code and UI change together.
4. Increment the backup/database schema only when persisted shape changes.
