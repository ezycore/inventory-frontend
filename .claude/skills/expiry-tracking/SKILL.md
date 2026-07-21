# Expiry Tracking (Frontend) — SKILL

> **Status**: PLANNED — not yet implemented. Master plan: `inventory-backend/docs/ai/BARCODE_AND_EXPIRY_PLAN.md`.
> Backend mirror: `inventory-backend/.claude/skills/expiry-tracking/SKILL.md`.
> Cross-cuts: sales-flow and purchase-flow FE skills (FEFO chip + batch picker live inside those flows).

## Scope
Frontend batch / expiry UX:
- PO row "Batch panel" (batchNumber, mfgDate, expiryDate, optional multi-batch split).
- Sell page FEFO chip + manual batch picker drawer.
- Inventory page "Near expiry / Expired" filter chips + per-row batch breakdown.
- `/dashboard/reports/expiry` page (StatsCard + DataTable + bulk Quarantine/Mark-expired).
- Dashboard `ExpiryWidget`.
- Returns: batch picker auto-defaults to the source batch.
- All gated by `useOrganizationFeatures().expiryTracking`.

## Touched files (planned)
```
components/shared/expiry/
  batch-picker.tsx          # drawer: pick batch(es), shows expiry + qty + near-expiry badge
  batch-row-panel.tsx       # expanding row inside PO create with batch fields
  expiry-badge.tsx          # color-coded badge by daysToExpiry
components/dashboard/                                # + ExpiryWidget (planned, not built)
app/(protected)/dashboard/reports/expiry/page.tsx
services/api/modules/inventory-batches/{api.ts,hooks.ts,index.ts}
services/api/query-keys.ts                          # + queryKeys.inventoryBatches
components/purchases/orders/                         # PO create form: use BatchRowPanel when hasExpiry
components/sales/sell/*                             # FEFO chip + BatchPicker entry
app/(protected)/inventory/page.tsx                  # + filter chips, + expandable batch rows
components/sales/returns/*                          # batch picker + auto reason=expired when past date
components/purchases/returns/*                      # same
package.json                                        # (no new deps; date-fns already present)
```

## Key rules (refine as code lands)
1. Every UI surface wrapped in `useOrganizationFeatures().expiryTracking`. Existing flows behave EXACTLY as today when the flag is off — no extra clicks for non-expiry products even when the flag is on.
2. The FE does NOT pick FEFO batches itself. On sale create, leave `items[i].batches` undefined and let backend allocate. FE only sends explicit `batches[]` when the user manually overrides via `BatchPicker`.
3. PO create: for any line where `product.hasExpiry=true`, REQUIRE at least one batch with `expiryDate >= today` BEFORE submit; block submit and scroll to the offending row.
4. `expiry-badge.tsx` color thresholds: `>= 60d` neutral, `30–59d` warning, `7–29d` orange, `< 7d` destructive, `<= 0` destructive solid + "EXPIRED" label.
5. `useInventoryBatches` filters: `variantId?`, `locationId?`, `status?`, `daysToExpiry?`. Use the central `queryKeys.inventoryBatches.list(filters)` factory.
6. Location switch invalidates all batch queries (location-scoped). Hook into existing location-switch handler.
7. Date inputs use `date-fns-tz` against the org's `timezone` (already in auth store).

## Display contract (from BE response)
```ts
type InventoryBatch = {
  _id: string;
  productId: string; variantId: string; locationId: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate: string;
  daysToExpiry: number;          // BE-computed
  quantity: number;
  initialQuantity: number;
  costPrice: number;
  value: number;                 // qty * costPrice, BE-computed
  status: "active" | "depleted" | "expired" | "quarantined";
  // populated:
  product?: { name: string };
  variant?: { name: string; attributes?: Record<string, string> };
  location?: { name: string };
};
```

## Pitfalls
- Sell-page cart Zustand store currently has no batch concept. When user opens `BatchPicker` and overrides, store the override in cart item as `batches: [{ batchId, qty }]`. Backend trusts what FE sends only when present.
- PO line qty MUST equal sum of its batch qtys when batches are provided. Add a Zod refine.
- Returns: don't show a batch picker for products that aren't expiry-tracked. Use the source sale/PO item's `batches` to drive UI conditionally.
- `/dashboard/reports/expiry` is already linked in `constants/navItem.ts` behind the flag — page just needs to exist. Don't add a new nav entry.

## Maintenance discipline (MANDATORY once code lands)
Any PR touching the files listed above MUST in the same commit:
1. Update this skill.
2. Update `inventory-backend/.claude/skills/expiry-tracking/SKILL.md` if the wire contract changes.
3. Update sales-flow + purchase-flow FE skills if their write path branched on expiry changes.
4. Update `BARCODE_AND_EXPIRY_PLAN.md` if scope/phasing changes.

Never let the skill drift from the code. Either both move or neither moves.
