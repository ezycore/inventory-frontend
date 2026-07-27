# Expiry Tracking (Frontend) — SKILL

> **Status**: implemented. Backend mirror: `inventory-backend/.claude/skills/expiry-tracking/SKILL.md`
> and `inventory-backend/docs/features/expiry.md` (authoritative on behaviour).
> Design history: `inventory-backend/docs/plan/expiry-batch-invariant.md`.
>
> **Rewritten 2026-07-28.** Until then this file described a design that was never built: it was
> marked "PLANNED", pointed at a plan file (`docs/ai/BARCODE_AND_EXPIRY_PLAN.md`) and at five
> component/module paths (`components/shared/expiry/*`, `services/api/modules/inventory-batches/`,
> `app/(protected)/dashboard/reports/expiry/`) **none of which exist**, and specified a
> `daysToExpiry`/`quarantined` wire contract the API does not return. Everything below is checked
> against the code.

## What the FE actually renders

| Surface | File |
|---|---|
| Lot picker (POS cart + adjustment) | `components/shared/batch-select.tsx` — the **one** picker |
| Lot label helpers + `isBatchExpired` | same file (`batchNumberLabel`, `expiryLabel`, `isUnknownExpiry`) |
| Adjustment draw allocation | `components/inventory/adjust/use-batch-draws.ts` |
| Per-lot table on stock detail | `components/inventory/detail/inventory-batches.tsx` |
| Assign-expiry dialog | `components/inventory/detail/assign-expiry-dialog.tsx` |
| Expiry report | `components/reports/expiry-report.tsx` |
| Receive-time capture + missing-date warning | `components/purchases/orders/receive-items-dialog.tsx` |
| API + hooks | `services/api/modules/inventory/{api,hooks}.ts`; types in `analytics.types.ts` (`BatchRow`) |

## Key rules

1. **The ledger is not a feature flag.** Since backend D10 (2026-07-27) lots are maintained for
   every `product.hasExpiry` product regardless of `features.expiryTracking`. The org feature gates
   **presentation only** — expiry inputs, the reports, the CSV export, alerts.
   - The corollary that bites: `GET /inventory/:productId/batches` is **not** feature-gated,
     because `bulk-adjust` requires a tracked decrease to name its lots and that endpoint is where
     they come from. Do not add a feature check around the lot picker: a feature-off org with a
     `hasExpiry` product still has to be able to adjust it.
2. **The FE does not choose FEFO for a sale.** Leave `items[i].batchId` undefined and let the
   backend allocate. Send a `batchId` only when the user picks a lot in `BatchSelect`.
   The backend refuses an expired lot even when named (`STOCK_BATCH_EXPIRED`).
3. **An adjustment *decrease* of a tracked product must name its lots.** `useBatchDraws`
   pre-allocates them (expired first, then earliest expiry, unknown last) and blocks submit until
   `isBalanced`. The server rejects an unbalanced set anyway (`ADJUST_BATCH_DRAWS_MISMATCH`).
4. **Never block a receive on a missing expiry date** — warn instead. Undated stock lands in the
   product's unknown-expiry lot and can be dated later; blocking just moves the dead end to the
   receive form.
5. **The unknown-expiry lot is an ordinary lot with a `null` date**, not an error state. Render it
   as "Unknown batch" / "Unknown expiry" via the shared helpers — never a blank cell, which reads
   as missing data and hides the one lot most likely to go off unnoticed.
   - The labels are **UI-only**. `batchNumber` and `expiryDate` stay `null` in the data: both are
     part of the server's unique lot-merge key, and a literal like `"UNKNOWN"` written
     inconsistently would split one lot into several.
6. **Expired lots stay visible.** They are still on hand until written off, so pickers show them
   (prefixed `EXPIRED`) rather than hiding them — a write-off is exactly when the user needs to
   find them.
7. Invalidate with `invalidate(qc, 'stock.moved')` after any lot write, including assign-expiry
   (nothing moves, but every lot list and report changes shape).

## Wire contract (`BatchRow`, `analytics.types.ts`)

```ts
interface BatchRow {
  _id: string
  batchNumber?: string          // null/absent on the unknown lot
  remainingQuantity: number
  expiryDate?: string | null    // null = unknown-expiry lot
  costPrice?: number
}
```

There is no `daysToExpiry`, no `initialQuantity`, no `value`, and no `quarantined` status — the
server sends `active | depleted | expired` and the FE derives urgency from `expiryDate` itself
(`differenceInCalendarDays`). `sortExpiry` exists server-side as the FEFO sort key but is
`select: false` and never reaches the API.

## Pitfalls

- **`new Date(null)` is the Unix epoch**, so any expiry comparison that forgets the null guard
  reports the unknown lot as long expired — which would write off good stock and exclude it from
  every sale. Use `isBatchExpired` / `isUnknownExpiry`, never a bare `new Date(b.expiryDate) < now`.
- Sorting by expiry must send null **last**. `use-batch-draws.ts` maps it to `Infinity` for this.
- The purchase-order line does **not** carry `hasExpiry`, so the receive dialog cannot tell which
  lines are tracked; its missing-date warning counts every dateless line. Harmless — the receive
  behaves identically either way — but do not build anything load-bearing on that count.

## Maintenance discipline

Any change to the files in the table above updates this skill in the same commit, plus
`inventory-backend/docs/features/expiry.md` if the wire contract or behaviour moved. Either both
move or neither moves — this file spent months describing a design that was never built.
