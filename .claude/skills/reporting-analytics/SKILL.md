---
name: reporting-analytics
description: 'Reports and dashboard on the FRONTEND — the report pages (inventory, sales, purchases, cash, employees, stock valuation, tax + tax ledger, combos, expiry), the shared period filter, stat tiles/charts, and report CSV export. USE WHEN: building or fixing a report page, a stat card or chart, the date-range/period filter, tax report/rate/ledger tables, the dashboard overview/stats, "report numbers don''t match the ledger", or report export. Touches `inventory-frontend/{app/(protected)/reports,components/reports,services/api/modules/reports,services/api/modules/dashboard}`. Reports are READ-ONLY aggregates; the BACKEND computes them from the ledger and never re-derives money — read `inventory-backend/.claude/skills/reporting-analytics/SKILL.md`; this file does not duplicate it.'
---

# Reporting & Analytics Skill (Frontend)

Report and dashboard pages **render server-computed aggregates**. They never recompute money — a total
that disagrees with a detail view means the aggregate is wrong on the backend, not that the FE should
"fix" it locally.

> **The aggregations are NOT here.** What each report sums, how tax reporting reads the denormalized
> `taxTotal` snapshot (never re-derives tax), and the `$group` shapes live in
> [`inventory-backend/.claude/skills/reporting-analytics/SKILL.md`](../../../../inventory-backend/.claude/skills/reporting-analytics/SKILL.md).
> Read it before adding a report — the FE is a viewer.

---

## 1. Report pages

Under [`app/(protected)/reports/`](../../../app/(protected)/reports): `inventory`, `sales`, `purchases`,
`cash`, `employees`, `valuation` (stock valuation), `tax`, `expiry`, `export`, plus the index `page.tsx`.

Each renders a component in [`components/reports/`](../../../components/reports):
`inventory-report.tsx`, `sales-report.tsx`, `purchase-report.tsx`, `cash-report.tsx` (+ its
`cash/` parts),
`employee-report.tsx`, `valuation-report.tsx`, `expiry-report.tsx`, `tax-report.tsx` (+
`tax-rate-table.tsx`, `tax-ledger-table.tsx`, `tax-trend-chart.tsx`), `top-combos-card.tsx`,
`sales-breakdown-card.tsx` (+ `sales-breakdown-list.tsx`), and `export-data.tsx`.

### Sales by category / brand / tag (on the Sales Report page)

`sales-breakdown-card.tsx` reads `GET /reports/sales/breakdown` through `useSalesBreakdown(dimension,
params)` — its own query, keyed per dimension, so switching Category / Brand / Tag refetches one small
aggregate rather than the whole sales report. The server nets returns, ranks by revenue and lists groups
that sold **nothing** (so the lowest sellers are real); the card only re-sorts for "Rank by" and splits
the one list with `splitBreakdown()` (`utils/sales-breakdown.ts`, tested) — top takes at most half, so
a short list never shows a group in both halves.

Rules that come from the backend contract, not taste:

- **`overlapping: true` (tags) must print the overlap note.** A product with two tags counts in both
  rows; never draw tag rows as a pie, a stacked bar, or anything that reads as a split of the total.
- **`unassigned` is a footnote, never a row** — otherwise "No brand" ranks as a top brand.
- **Revenue is line value after returns**, so it will not equal the Total Sales tile; the card says so
  (`basisNote`). Don't reconcile it client-side.
- `name: null` is a deleted group; render `deleted`, don't drop the row.

---

## 2. Shared period filter — use it, don't fork it

Every report filters by date range through the **one** shared control:

- [`components/shared/period-filter.tsx`](../../../components/shared/period-filter.tsx)
  + the [`use-report-period.ts`](../../../components/reports/use-report-period.ts) hook.

It exports two renderings of the same control, and the choice is about the row it sits in, not the
screen: **`PeriodFilter`** (pills) where the date range is the page's primary control — reports, the
dashboard, transactions — and **`PeriodSelect`** (one dropdown, custom range revealed on demand)
where it is one filter among several, as on the orders list. Both take the same props and resolve the
custom pickers against the **organization's** timezone by default.

It uses two `DatePicker`s with cross-bounds (the established from/to pattern) — timezone-safe
`yyyy-MM-dd` output, never native ISO (avoids the BDT/UTC off-by-one). Don't add a second date-range
implementation; extend this one.

The `chartGrouping`/period granularity the backend returns is a 4-value enum
(`hourly|daily|weekly|monthly`) — the generated types carry it precisely now (a prior `z.string()` was
tightened backend-side), so the period header type-checks against the report response.

---

## 3. API modules & types

- [`services/api/modules/reports`](../../../services/api/modules/reports) — one method per report,
  each typed off the generated report DTOs via `@/types/api` (`InventoryReport`, `SalesReport`,
  `PurchaseReport`, `CashReport`, `StockValuationReport`, `EmployeeReport`, `TaxReport`, `TaxLedger`,
  `ComboSalesReport`, `SalesBreakdownReport`). Sub-rows (`TaxRateRow`, `TaxChartPoint`, `TaxLedgerEntry`,
  `ComboSalesRow`, `SalesBreakdownRow`, `SalesBreakdownDimension`) are
  **derived** from those generated parents, not hand-written.
- [`services/api/modules/dashboard`](../../../services/api/modules/dashboard) — `DashboardOverview` /
  `DashboardStats` (generated); the FE keeps only `DashboardPeriod` for params.

---

## 4. Presentation conventions

- **Stat tiles**: use the shared `StatsCard` (`ui/components/StatsCard`) — see the `stats-card` skill.
  Don't hand-roll a stat box.
- **Charts**: follow the existing report charts (e.g. `tax-trend-chart.tsx`) — consistent axis/format.
- **Period-on-period trends: `calcPeriodChange` (`utils/period-change.ts`) — never a local copy.**
  It returns **`null` when there is no basis**: a previous period of zero, or a move that rounds to
  nothing. Five hand-rolled `calcChange` copies read a zero previous period as **100% growth**, so a
  shop's first trading month printed "↑ 100% vs previous period" under every tile — a number with no
  basis, stated as fact (found in a browser on real data, 2026-09-22). Pinned by
  `utils/period-change.test.ts`.
  Every trend on the dashboard KPI row, the Sales, Purchase, Orders and Cash reports now goes
  through it. **The one deliberate exception is `profit-loss-report.tsx`**, which keeps its own
  two-line helper because it renders differently: a **signed** `-25%` with the arrow derived from
  the sign, and a literal `0%` for a flat period. It also had the zero case right from the start —
  it was the only copy that did, which is where the shared helper's behaviour came from.
- **A count in a sentence needs ICU plural.** `"{count} orders"` renders "1 orders". Use
  `"{count, plural, one {# order} other {# orders}}"`; Bangla does not inflect the noun, so
  `"{count}টি অর্ডার"` is correct for both.
- **VAT reports** are gated by the `tax` feature; gate with `isVatActive` (see the
  [`vat`](../vat/SKILL.md) skill — `isTaxActive` no longer exists) and hide
  tax reports when off.
- **Export**: report CSV export goes through `export-data.tsx` / the report `export` route — reuse it.
- **Ledger money is "cash in / cash out", never "income / expense"** — the ledger totals include the
  cash leg of a sale and exclude owner capital, so P&L words on them are wrong. Say Cash In, Cash
  Out, Owner Capital (`reports.cash.*` and `accounts.transactions.stats.*` share the wording), and
  group category rows by the backend's **`kind`**, never by `type` — see the backend
  [`accounting-ledger`](../../../../inventory-backend/.claude/skills/accounting-ledger/SKILL.md)
  skill. A section that groups by `type` puts owner capital under a total that excludes it.
- **Category and enum labels are message keys, not string transforms.** Reuse
  `accounts.transactions.categories.*` / `accounts.accounts.types.*` (`t.has(key)` guards the
  unattributed row). A `replace(/([A-Z])/g,' $1')` prints `Capital_in` and stays English in Bangla.

---

## 5. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Report total ≠ detail view | aggregate wrong on the backend | fix the aggregation server-side; don't patch the FE number |
| Off-by-one day at range edges | native ISO date output | use the shared `DatePicker` (`yyyy-MM-dd`) via the period filter |
| Period header type error | grouping typed too loosely | it's the 4-value `chartGrouping` enum now — regen types |
| VAT report visible without the feature | missing gate | gate on `isVatActive` |
| Net payable shown as output − input for every org | only a standard-rated org reclaims input VAT | branch on `data.input.recoverable` — [`vat`](../vat/SKILL.md) §5 |
| Duplicated date-range picker | forked the filter | reuse `components/shared/period-filter.tsx` — `PeriodFilter` or `PeriodSelect` |

---

## 6. Things NOT to do

- Don't recompute money in a report — render the server aggregate.
- Don't re-derive tax in the UI — the backend reads the stored `taxTotal` snapshot.
- Don't fork the period filter or the stat-card / chart primitives.
- Don't hand-write report response types — alias/derive the generated DTOs.
