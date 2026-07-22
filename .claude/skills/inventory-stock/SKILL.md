---
name: inventory-stock
description: 'Inventory & stock on the FRONTEND — the current-stock list, stock movements table, receive/adjust/transfer flows, low-stock and per-product inventory detail, plus the stock/inventory API modules and their zustand page stores. USE WHEN: building or fixing the inventory list, a stock adjustment or transfer form, the movements/history view, low-stock alerts, opening-stock creation, batch/expiry columns, "stock not updating after a sale/purchase" in the UI, negative or wrong quantities shown, or active-location scoping of stock. Touches `inventory-frontend/{app/(protected)/inventory,components/inventory,services/api/modules/stock,services/api/modules/inventory,services/stores/stock-adjustment-store.ts,services/stores/stock-transfer-store.ts}`. The stock INVARIANTS (movement-before-update, ≥0, one row per tuple, base-unit cost) are the BACKEND''s — read `inventory-backend/.claude/skills/inventory-stock/SKILL.md`; this file does not duplicate them.'
---

# Inventory & Stock Skill (Frontend)

The frontend for inventory: view current stock, move it (receive / adjust / transfer / return), and
read its history. The numbers and the rules are the backend's; the FE renders and submits them.

> **The invariants are NOT here.** Every quantity change is a `StockMovement` created *before* the
> inventory update; quantity is always ≥ 0; one inventory row per `(org, location, product, variant)`;
> cost and quantity are both stored in **base units**. All of that is enforced server-side and documented
> in [`inventory-backend/.claude/skills/inventory-stock/SKILL.md`](../../../../inventory-backend/.claude/skills/inventory-stock/SKILL.md).
> The FE must not re-derive stock value with a UOM factor — the server already returns per-base-unit cost.

---

## 1. Pages

Under [`app/(protected)/inventory/`](../../../app/(protected)/inventory):

| Route | Purpose |
|---|---|
| `page.tsx` | current-stock DataTable (active-location scoped) |
| `movements/` | the append-only stock-movement history |
| `adjust/` | stock adjustment flow |
| `transfers/` | inter-location transfer flow |
| `lowstock/` | low-stock / shortlist view |
| `[id]/` | per-product inventory detail (levels, batches, analytics) |

Feature/columns: [`components/inventory/`](../../../components/inventory) — `columns.tsx`, `filters.ts`,
`stats.ts`, `helpers.ts`, `form-config.ts`, `inventory-search.tsx`.

---

## 2. API modules

Two modules, deliberately distinct:

- [`services/api/modules/inventory/`](../../../services/api/modules/inventory) — the inventory *records*:
  `getAll`, `getById`, `create`/`update` (opening stock), the `bulk*` mutators
  (`bulkReceiveStock`, `bulkAdjustStock`, `bulkSellStock`, `bulkReturnSale`, `bulkReturnPurchase`,
  `bulkTransferStock`), CSV export (`exportCsv`, `exportBatchCsv`, `downloadImportTemplate`),
  `getShortlist`, batch reads (`getExpiringBatches`, `getExpiredBatches`, `getProductBatches`), and
  analytics (`getProductAnalytics`, `getInventoryAnalytics`, typed in `analytics.types.ts`).
- [`services/api/modules/stock/`](../../../services/api/modules/stock) — the *movements* + level views:
  `getMovements`, `getMovementsByVariant`, `getStockLevels`, `createMovement`, `adjustStock`,
  `transferStock`, `getOverview`, `getLowStock`, `getInventoryHistory`.

> Every mutator is a `bulk*`/action method that maps to a service endpoint which writes a movement
> first. **Do not** try to PATCH a quantity directly — there is no such endpoint, by design.

Types come from the generated backend types (`ApiInventory`, `ApiVariant`, stock/movement DTOs) via
`@/types/api` — see the `api-module` skill.

---

## 3. Page stores (zustand)

Multi-step flows keep working state in dedicated stores, not component state:

- [`services/stores/stock-adjustment-store.ts`](../../../services/stores/stock-adjustment-store.ts)
- [`services/stores/stock-transfer-store.ts`](../../../services/stores/stock-transfer-store.ts)

They hold the selected products, quantities and reason for the multi-line adjust/transfer forms so the
UI can build one bulk payload. Reset them on submit/cancel.

---

## 4. Scoping & display rules

- Inventory is **active-location scoped** — the list and stock reads reflect the location in the auth
  store's `activeLocationId` (sent as `X-Active-Location`). Switching location must refetch.
- **Cost is already per base unit** — render `quantity × costPrice` directly; do **not** divide by a
  conversion factor on the client (that was the old per-purchase-unit model). COGS/profit come from the
  server pre-computed.
- Batch/expiry columns only appear when `expiryTracking` is enabled and the product has expiry — gate
  with the feature helper; see the `expiry-tracking` skill.

---

## 5. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Stock unchanged in UI after a sale/purchase | list not invalidated | invalidate `queryKeys.inventory.all()` / `stockMovements.*` on the mutation |
| Wrong location's stock shown | active-location not threaded / not refetched | ensure `X-Active-Location` and refetch on location switch |
| Stock value looks doubled/halved | client applied a UOM factor to cost | remove it — server cost is per base unit |
| "Can't set quantity directly" | there is no direct-set endpoint | use the right `bulk*`/adjust flow (movement is written first) |
| Batch columns missing | `expiryTracking` off or product `hasExpiry` false | expected — gate on the feature + product flag |

---

## 6. Things NOT to do

- Don't divide/multiply cost by a UOM factor on read — the server returns base-unit cost.
- Don't invent a "set quantity" call — mutate through the adjust/transfer/receive flows.
- Don't read inventory without active-location scoping.
- Don't duplicate the invariant rules here — link to the backend skill.
