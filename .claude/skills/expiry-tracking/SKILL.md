# Expiry Tracking (Frontend) — SKILL

> **Status**: SHIPPED (partially — see "Not built"). Backend mirror:
> `inventory-backend/.claude/skills/expiry-tracking/SKILL.md` — that repo owns the batch ledger
> invariants and FEFO allocation; this file does not restate them.

Everything here is gated on `organization.features.expiryTracking` **and** the product's own
`hasExpiry`. Both must be true — the org flag alone does not make a product batch-tracked.

## Where batches actually live (read this before adding an API call)

There is **no** `services/api/modules/inventory-batches/` module and **no** `queryKeys.inventoryBatches`
factory. Batches are part of the **inventory** resource:

| Thing | Real location |
|---|---|
| API methods | `services/api/modules/inventory/api.ts` — `getExpiringBatches`, `getExpiredBatches`, `getProductBatches`, `exportBatchCsv` |
| Hooks | `services/api/modules/inventory/hooks.ts` — `useExpiringBatches`, `useExpiredBatches`, `useProductBatches` |
| Query keys | `queryKeys.inventory.{expiring,expired,productBatches}` — under the `inventory` root, so one `invalidateQueries({ queryKey: queryKeys.inventory.all() })` flushes batches too |
| Response type | `ProductBatch` from `@/types/api` (generated — do not hand-write a batch type) |

`GET /api/inventory/:productId/batches` returns only lots with `remainingQuantity > 0`, **FEFO-ordered
(soonest expiry first)**, already scoped to the active location server-side. That order is contractual:
the adjust picker relies on it. Do not re-sort client-side — a client sort would silently diverge from
the server's idea of FEFO.

## Surfaces that exist today

- **Adjust Stock** (`components/inventory/adjust/`) — both directions, see the next section.
- **Inventory detail** — `components/inventory/detail/inventory-batches.tsx`, a per-lot table fed by
  the analytics payload's `batches` (`BatchRow` in `services/api/modules/inventory/analytics.types.ts`).
- **Expiry report** — `app/(protected)/reports/expiry/page.tsx` + `components/reports/expiry-report.tsx`.
- **Purchases** — batch capture on receive (`components/purchases/orders/receive-items-dialog.tsx`,
  `components/purchases/expiry-cells.tsx`).
- **Sales** — batch handling in `components/sales/sell/use-sell-page.ts`.
- **Shared** — `components/shared/expiry/expiry-badge.tsx`: `ExpiryBadge`, plus `daysToExpiry()` and
  `isExpired()`. **Use these; never re-derive a day count or a threshold.** Thresholds are
  `< 0` expired (destructive), `≤ 30d` amber, else neutral. Strings live at `inventory.expiry.*`
  (moved out of `inventory.detail.*` when the badge became shared).

## Adjust Stock: the batch rules (the part that bites)

`Inventory.quantity` must stay equal to the sum of its batches' `remainingQuantity`, so **every**
adjustment of a tracked product has to say which lot it touches. The backend enforces this; the UI
mirrors it so the user is stopped at the form, not by a failed submit halfway through a bulk write.

- **Increase** → `expiryDate` (opens a new lot) — captured by the expiry fields in
  `adjustment-form-card.tsx`, guarded by `showExpiryFields`. The wire also accepts `batchId` to add
  into an **existing** lot instead, which **the UI does not offer yet** (see "Not built").
- **Decrease** → `batchDraws: [{ batchId, quantity }]`, summing **exactly** to the removed quantity.
  Owned by `use-batch-draws.ts` (allocation state) and `batch-draw-picker.tsx` (the UI).

Until 2026-07-26 the FE **blocked** a tracked decrease outright (`adjust.expiryDecreaseUnsupported`,
now deleted) because the backend had no write-off path. It does now — do not reintroduce that guard.

`useBatchDraws` pre-fills FEFO because a write-off almost always means the oldest stock, then lets the
user move quantity between lots. It mirrors two backend errors up-front:
`ADJUST_BATCH_DRAWS_MISMATCH` (draws must total the removed quantity → `isBalanced`) and
`INSUFFICIENT_BATCH_STOCK` (no draw may exceed its lot → `hasOverdrawnLot`, plus `max` on the
`NumberField`). `insufficientStock` is the separate case where *all* lots together can't cover the
decrease — the adjustment is impossible, not merely mis-split.

Two behaviours worth not breaking:

- The seeding effect is keyed on the **joined batch ids + preset string + removed quantity**, not on
  the array identity — otherwise a refetch returning equal data wipes the user's manual split.
- `presetDraws` restores the saved split when re-opening a pending row for edit, but **only while it
  still balances**; a changed quantity makes the old split meaningless, so it falls back to FEFO.
  `updateItem` explicitly clears `batchDraws` before spreading the new payload, so a row that stops
  being a tracked decrease can't carry a stale split.

A draw from a **past-expiry** lot is booked by the backend as an expiry write-off
(`MovementReason.EXPIRY`) rather than a plain `ADJUSTMENT` — same units leave stock, different report.
The picker says so when such a lot is drawn from (`adjust.expiredDrawNote`).

## Not built (do not assume these exist)

- **`batchId` on an increase** — adding into an existing lot. The wire supports it; the UI always
  opens a new lot via `expiryDate`.
- A dedicated batch-picker **drawer** for sales returns / purchase returns.
- A dashboard expiry widget.

## Maintenance discipline (MANDATORY)

A PR touching `components/inventory/adjust/{use-batch-draws,batch-draw-picker}.ts(x)`,
`components/shared/expiry/*`, the batch API methods/hooks/keys above, or the batch fields on
`AdjustmentItem` MUST update this skill in the same commit. If the **wire contract** changes, update
the backend `expiry-tracking` skill too. Never let either drift.
