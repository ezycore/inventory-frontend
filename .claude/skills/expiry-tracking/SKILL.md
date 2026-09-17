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
>
> **Merged 2026-07-29** with the `development` copy, which was written against the same feature
> built independently on another branch. Where the two disagreed, the merged tree won — see
> "Resolved disagreements" below, which records what the other copy claimed and why it is not
> repeated here.

## What the FE actually renders

| Surface | File |
|---|---|
| Lot picker (POS cart + adjustment) | `components/shared/batch-select.tsx` — the **one** picker |
| Lot label helpers + `isBatchExpired` | same file (`batchNumberLabel`, `expiryLabel`, `isUnknownExpiry`) |
| Shelf-life badge + `isExpired` / `daysToExpiry` | `components/shared/expiry/expiry-badge.tsx` — the **one** threshold; both take the org `timezone` and delegate to `lib/org-calendar.ts` (a lot is good through its whole expiry day on the org's calendar — CLAUDE.md → Timezones) |
| Adjustment draw allocation | `components/inventory/adjust/use-batch-draws.ts` (+ `.test.ts`) |
| Adjustment draw UI | `components/inventory/adjust/batch-draw-picker.tsx` |
| Per-lot table on stock detail | `components/inventory/detail/inventory-batches.tsx` |
| Assign-expiry dialog | `components/inventory/detail/assign-expiry-dialog.tsx` |
| Expiry report | `app/(protected)/reports/expiry/page.tsx` + `components/reports/expiry-report.tsx` |
| Expiry-report row type + `lotValue()` | `components/reports/expiry-report-types.ts` — the **one** place a lot's money value is computed |
| Write off an expired lot | `components/reports/expiry-write-off-dialog.tsx` + `useWriteOffExpiredBatch()` |
| Receive-time capture + missing-date warning | `components/purchases/orders/receive-items-dialog.tsx`, `components/purchases/expiry-cells.tsx` |
| Sales-side lot handling | `components/sales/sell/use-sell-page.ts` |
| API + hooks | `services/api/modules/inventory/{api,hooks}.ts`; types in `analytics.types.ts` (`BatchRow`) |

## Where batches live (read this before adding an API call)

There is **no** `services/api/modules/inventory-batches/` module and **no** `queryKeys.inventoryBatches`
factory. Batches are part of the **inventory** resource:

| Thing | Real location |
|---|---|
| API methods | `services/api/modules/inventory/api.ts` — `getExpiringBatches`, `getExpiredBatches`, `getProductBatches`, `exportBatchCsv` |
| Hooks | `services/api/modules/inventory/hooks.ts` — `useExpiringBatches`, `useExpiredBatches`, `useProductBatches` |
| Query keys | `services/api/query-keys.ts` → `queryKeys.inventory.{expiring,expired,productBatches}` — under the `inventory` root, so one invalidation of that root flushes batches too |
| Response type | `BatchRow` from `services/api/modules/inventory/analytics.types.ts` |

`GET /api/inventory/:productId/batches` returns only lots with `remainingQuantity > 0`,
**FEFO-ordered (soonest expiry first)**, already scoped to the active location server-side.

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
   pre-allocates them and blocks submit until `isBalanced`. The server rejects an unbalanced set
   anyway (`ADJUST_BATCH_DRAWS_MISMATCH`).
   - **Display order is the server's; allocation order is ours.** The API's FEFO order is
     contractual for *rendering* — do not re-sort a lot list you are showing. `orderForWriteOff`
     re-orders deliberately and only to seed the allocation (expired first, then earliest expiry,
     unknown last), because a write-off almost always means clearing what has already gone off.
     Keep that sort inside the allocation path; it is not a display sort.
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
7. **One definition of "expired".** `isExpired(expiryDate)` in `expiry-badge.tsx` is it;
   `isBatchExpired(batch)` in `batch-select.tsx` is only the `BatchRow`-shaped wrapper around it.
   It mirrors the server (`stock-batch.service.ts`): `expiryDate != null && new Date(expiryDate) < now`
   — an **instant** comparison, not a calendar-day one. Do not re-derive it from
   `daysToExpiry() < 0`: that calls a lot dated today "0 days left" while the backend already books
   a draw from it as `MovementReason.EXPIRY`, and the two disagree for a whole day.
   `daysToExpiry` is for the ≤30d amber band only.
8. A draw from a past-expiry lot is booked by the backend as an expiry write-off
   (`MovementReason.EXPIRY`) rather than a plain `ADJUSTMENT` — same units leave stock, different
   report. Worth surfacing in the picker so the user knows which one they are filing.
9. Invalidate with `invalidate(qc, 'stock.moved')` after any lot write, including assign-expiry
   (nothing moves, but every lot list and report changes shape).

## Wire contract (`BatchRow`, `analytics.types.ts`)

```ts
interface BatchRow {
  _id: string
  batchNumber?: string          // null/absent on the unknown lot
  remainingQuantity: number
  expiryDate?: string | null    // null = unknown-expiry lot
  costPrice?: number            // per BASE unit — value is a plain multiply, no factor
  inventoryQuantity?: number | null   // expiry reports only; see below
}
```

**`inventoryQuantity` is on-hand across every lot of that product at that location**, not this
lot's own quantity. It arrives on the two expiry report reads (`/expiry/expiring`, `/expiry/expired`)
so the report can write a lot off in place: `bulk-adjust` takes an **absolute** `newQuantity`
checked against an `expectedQuantity`, and this is that figure. `null` means no inventory row
matched — treat it as *"cannot write off from here"*, **never** as zero, or the write-off posts
`newQuantity: 0` against a row it never read.

**`days` on `/expiry/expiring` is an override, not a default.** Omit it and the backend applies each
product's own `expiryAlertDays`, which is what the product form promises. `ExpiryReport` therefore
defaults its selector to `null` and only sends `days` when the merchant picks a fixed window.

There is no `daysToExpiry`, no `initialQuantity`, no `value`, and no `quarantined` status — the
server sends `active | depleted | expired` and the FE derives urgency from `expiryDate` itself.
`sortExpiry` exists server-side as the FEFO sort key but is `select: false` and never reaches the API.

Adjustment wire, both directions:

- **Increase** → `expiryDate` opens a new lot, **or** `batchId` adds into an existing one — never
  both. Captured in `adjustment-form-card.tsx`, guarded by `showExpiryFields`.
- **Decrease** → `batchDraws: [{ batchId, quantity }]`, summing **exactly** to the removed quantity.

Until 2026-07-26 the FE **blocked** a tracked decrease outright (`adjust.expiryDecreaseUnsupported`,
now deleted) because the backend had no write-off path. It does now — do not reintroduce that guard.

## Pitfalls

- **`new Date(null)` is the Unix epoch**, so any expiry comparison that forgets the null guard
  reports the unknown lot as long expired — which would write off good stock and exclude it from
  every sale. Use `isBatchExpired` / `isUnknownExpiry`, never a bare `new Date(b.expiryDate) < now`.
- Sorting by expiry must send null **last**. `use-batch-draws.ts` maps it to `Infinity` for this.
- The purchase-order line does **not** carry `hasExpiry`, so the receive dialog cannot tell which
  lines are tracked; its missing-date warning counts every dateless line. Harmless — the receive
  behaves identically either way — but do not build anything load-bearing on that count.

## Open work (do not assume these exist)

- **Front-loaded validation of a mis-split decrease.** `isBalanced` covers
  `ADJUST_BATCH_DRAWS_MISMATCH` (the draws must total the removed quantity). Not yet mirrored:
  a per-lot cap for `INSUFFICIENT_BATCH_STOCK` (no draw may exceed its own lot) and the separate
  "all lots together cannot cover this decrease" case. Both currently fail server-side — which in a
  **bulk** adjust means some rows commit and some do not.
- **Restoring a saved split when re-opening a pending row** for edit. The row currently re-seeds
  from the allocation instead of showing the split the user chose.
- A dedicated batch-picker **drawer** for sales returns / purchase returns.
- A dashboard expiry widget.
- **A "write off all expired" bulk action.** Single-lot write-off shipped 2026-08-17; the bulk
  version would post several `bulk-adjust` rows in one call, which the backend already supports.

## Resolved disagreements (2026-07-29 merge)

The `development` copy of this skill was written 2026-07-27 against an independent build of the same
feature. Two of its claims are **wrong for this tree** and should not be reinstated:

- *"Everything here is gated on `organization.features.expiryTracking` **and** `hasExpiry`. Both must
  be true."* — true when written, invalidated hours later by backend D10. See rule 1.
- *"Use `daysToExpiry()`/`isExpired()`; `< 0` is expired."* — the helper survived, but its
  calendar-day rule did not; it now mirrors the server's instant comparison. See rule 7.

Its `ProductBatch from @/types/api` response type is also not what the batch surfaces use — they
take `BatchRow` from `analytics.types.ts`.

## Maintenance discipline

A PR touching `components/inventory/adjust/{use-batch-draws,batch-draw-picker}.ts(x)`,
`components/shared/expiry/*`, `components/shared/batch-select.tsx`, the batch API methods/hooks/keys
above, or the batch fields on `AdjustmentItem` MUST update this skill in the same commit, plus
`inventory-backend/docs/features/expiry.md` if the wire contract or behaviour moved. Either both
move or neither moves — this file spent months describing a design that was never built.
