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
`inventory-report.tsx`, `sales-report.tsx`, `purchase-report.tsx`, `cash-report.tsx`,
`employee-report.tsx`, `valuation-report.tsx`, `expiry-report.tsx`, `tax-report.tsx` (+
`tax-rate-table.tsx`, `tax-ledger-table.tsx`, `tax-trend-chart.tsx`), `top-combos-card.tsx`, and
`export-data.tsx`.

---

## 2. Shared period filter — use it, don't fork it

Every report filters by date range through the **one** shared control:

- [`components/reports/report-period-filter.tsx`](../../../components/reports/report-period-filter.tsx)
  + the [`use-report-period.ts`](../../../components/reports/use-report-period.ts) hook.

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
  `ComboSalesReport`). Sub-rows (`TaxRateRow`, `TaxChartPoint`, `TaxLedgerEntry`, `ComboSalesRow`) are
  **derived** from those generated parents, not hand-written.
- [`services/api/modules/dashboard`](../../../services/api/modules/dashboard) — `DashboardOverview` /
  `DashboardStats` (generated); the FE keeps only `DashboardPeriod` for params.

---

## 4. Presentation conventions

- **Stat tiles**: use the shared `StatsCard` (`ui/components/StatsCard`) — see the `stats-card` skill.
  Don't hand-roll a stat box.
- **Charts**: follow the existing report charts (e.g. `tax-trend-chart.tsx`) — consistent axis/format.
- **VAT reports** are gated by the `tax` feature; gate with `isVatActive` (see the
  [`vat`](../vat/SKILL.md) skill — `isTaxActive` no longer exists) and hide
  tax reports when off.
- **Export**: report CSV export goes through `export-data.tsx` / the report `export` route — reuse it.

---

## 5. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Report total ≠ detail view | aggregate wrong on the backend | fix the aggregation server-side; don't patch the FE number |
| Off-by-one day at range edges | native ISO date output | use the shared `DatePicker` (`yyyy-MM-dd`) via the period filter |
| Period header type error | grouping typed too loosely | it's the 4-value `chartGrouping` enum now — regen types |
| VAT report visible without the feature | missing gate | gate on `isVatActive` |
| Net payable shown as output − input for every org | only a standard-rated org reclaims input VAT | branch on `data.input.recoverable` — [`vat`](../vat/SKILL.md) §5 |
| Duplicated date-range picker | forked the filter | reuse `report-period-filter.tsx` |

---

## 6. Things NOT to do

- Don't recompute money in a report — render the server aggregate.
- Don't re-derive tax in the UI — the backend reads the stored `taxTotal` snapshot.
- Don't fork the period filter or the stat-card / chart primitives.
- Don't hand-write report response types — alias/derive the generated DTOs.
