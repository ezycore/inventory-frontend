---
name: products
description: 'Build, edit, debug, or audit the EasyStock Products feature end-to-end (BE Mongoose models + Zod validators + service + REST endpoints, FE list page + DynamicForm config + variant manager + helpers + TanStack Query hooks + cross-resource invalidation). USE WHEN: creating/editing single (`SINGLE`) or variable (`VARIABLE`) products, working with per-variant UOM conversion (enableUOMConversion + purchaseUnit + saleUnit), troubleshooting "purchaseUnit.unitId Required" 400s, variant fields silently dropped after save, edit modal not pre-filling variants, defaults (status=active, sellingType=retail, taxType=inclusive, productType=single, enableUOMConversion=false) not applying, related-resource changes (categories/brands/units/variant-attributes) not refreshing the products list, list response too verbose, hot-reload not picking up Mongoose schema changes. Touches `easystock-backend/src/{models,services,validators,controllers,routes,types}/product*` + `variant-product*`, `easystock-frontend/{app/(protected)/products,components/products,services/api/modules/products,services/api/modules/variants}`.'
---

# Products Skill

End-to-end map of the **Products** resource: backend (model → validator → service → controller → routes), frontend (list page → form config → variant manager → API hooks → cross-resource invalidation), the response shapes the FE depends on, default values, UOM rules, and the recurring pitfalls.

> Treat this as the single source of truth. If a behavior contradicts what's here, **fix the code**, not the doc — but only after re-reading both layers.

---

## 1. Conceptual Model

A **Product** is either:

| productType | Variants | UOM conversion location |
|-------------|----------|--------------------------|
| `single`   | none — sold as a single SKU                                      | on the **product** itself (`enableUOMConversion`, `purchaseUnit`, `saleUnit`) |
| `variable` | 1..N rows in `VariantProduct` collection, one per attribute combo | on **each variant** (per-variant UOM, parent UOM hidden in UI) |

Multi-tenant: every doc is scoped by `organizationId`. Never trust org/loc from the request body.

---

## 2. Backend Files Map

| File | Purpose |
|------|---------|
| [easystock-backend/src/models/product.model.ts](../../../../easystock-backend/src/models/product.model.ts) | Parent product schema (single OR variable) |
| [easystock-backend/src/models/variant-product.model.ts](../../../../easystock-backend/src/models/variant-product.model.ts) | Per-variant doc — owns its own UOM fields |
| [easystock-backend/src/validators/product.validator.ts](../../../../easystock-backend/src/validators/product.validator.ts) | Zod schemas for create/update + UOM superRefine gating |
| [easystock-backend/src/services/product.service.ts](../../../../easystock-backend/src/services/product.service.ts) | `BaseService` impl: `projectListItem`, `attachVariantsToProduct`, `createVariants`, `updateVariants`, `processVariantImages` |
| [easystock-backend/src/controllers/product.controller.ts](../../../../easystock-backend/src/controllers/product.controller.ts) | Extends `BaseController` — multipart parsing, image upload wiring |
| [easystock-backend/src/routes/product.routes.ts](../../../../easystock-backend/src/routes/product.routes.ts) | `authenticate → authorize(perm) → validate → controller` |
| [easystock-backend/src/types/variant.types.ts](../../../../easystock-backend/src/types/variant.types.ts) | `IVariantProductDocument`, `Variant`, `CreateVariantDto` |

### Schema (variant-product.model.ts) — relevant fields

```ts
{
  productId, organizationId, attributes: Mixed, price, images, status,
  enableUOMConversion: { type: Boolean, default: false },
  purchaseUnit: { unitId: ObjectId(ref Unit), conversionFactor: Number(min 0.0001, default 1) },
  saleUnit:     { unitId: ObjectId(ref Unit), conversionFactor: Number(min 0.0001, default 1) },
}
```

### Service rules

- `afterGetMany` → `projectListItem(p)` returns the slim shape (≈10 keys + `variants[]` only when VARIABLE for `variant_count`). **Never expand list shape without checking FE table columns.**
- `afterGetOne` → `attachVariantsToProduct(product)` returns the **full** variant docs (lean, all fields) so the edit form can prefill UOM.
- `update(id, body)` — when `productType==='variable'` and `body.variants !== undefined`, calls `processVariantImages` then `updateVariants`. `updateVariants` must `findByIdAndUpdate` with `enableUOMConversion ?? false`, `purchaseUnit`, `saleUnit` for **both** the update-existing and create-new branches.

### Validator rules (Zod superRefine)

- `single` + `enableUOMConversion=true` → top-level `purchaseUnit.unitId` AND `saleUnit.unitId` required.
- `variable` → per-variant: if `enableUOMConversion=true` → that variant's `purchaseUnit.unitId` AND `saleUnit.unitId` required.
- `single` + `enableUOMConversion=false` → top-level `purchaseUnit`/`saleUnit` MUST be omitted entirely (the FE strips them).

### REST endpoints (mounted at `/api/products`)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/products` | Paginated list (slim shape) |
| `GET` | `/products/:id` | Full product + full variants |
| `POST` | `/products` | multipart/form-data; `variants` is JSON-stringified field |
| `PUT` | `/products/:id` | multipart/form-data; same |
| `DELETE` | `/products/:id` | |
| `GET` | `/products/:id/variants` | (read) |

> **Frontend uses `/api/products/...` directly — NOT `/api/v1/...`. Don't add `v1` to FE calls.**

### Slim list response shape (`projectListItem`)

This shape is used for both the list table **and** the edit modal (no separate detail fetch). It must include all fields the edit form needs.

```jsonc
{
  "_id": "...", "name": "...", "status": "active",
  "sellingType": "retail", "taxType": "inclusive", "productType": "variable",
  "price": 0, "description": "...",
  "images": [],
  // Raw IDs — required for the edit form to pre-select dropdowns
  "categoryId": "...", "brandId": "...", "taxId": "...", "unitId": "...",
  // Nested display objects — used by table cells / card subtitles
  "category": { "_id", "name" }, "brand": { "_id", "name" }, "unit": { "_id", "name" },
  "enableUOMConversion": false,
  "purchaseUnit": { "conversionFactor": 1 }, "saleUnit": { "conversionFactor": 1 },
  "createdAt": "...", "updatedAt": "...",
  // Only for variable products:
  "variants": [{ "_id", "productId", "organizationId", "attributes", "price", "images", "status", "enableUOMConversion", "purchaseUnit", "saleUnit", ... }],
  "variant_count": 3
}
```

> **Critical rule**: never remove `categoryId`/`brandId`/`taxId`/`unitId` raw IDs from this shape — the edit modal reads them directly from the list row (there is **no separate GET :id call** before opening the edit form). If they're missing, all select dropdowns appear blank in the edit form.

### Detail response shape (`afterGetOne`) — extra keys

```jsonc
{
  ...allParentFields,
  "enableUOMConversion": false,
  "purchaseUnit": { "unitId": "...", "conversionFactor": 1 },
  "saleUnit":     { "unitId": "...", "conversionFactor": 1 },
  "variants": [
    {
      "_id", "productId", "organizationId", "attributes": { "Strength": "5mg" },
      "price", "images", "status",
      "enableUOMConversion": true,
      "purchaseUnit": { "unitId", "conversionFactor": 24 },
      "saleUnit":     { "unitId", "conversionFactor": 1 }
    }
  ]
}
```

---

## 3. Frontend Files Map

| File | Purpose |
|------|---------|
| [easystock-frontend/app/(protected)/products/page.tsx](../../../app/(protected)/products/page.tsx) | DataTable wiring + `transformEditData` |
| [easystock-frontend/components/products/form-config.tsx](../../../components/products/form-config.tsx) | DynamicForm field config + defaults + dependsOn |
| [easystock-frontend/components/products/variant-manager.tsx](../../../components/products/variant-manager.tsx) | Per-variant UI (table + edit modal with UOM) |
| [easystock-frontend/components/products/helpers.ts](../../../components/products/helpers.ts) | `prepareSubmitData` — strips inapplicable UOM, maps variants to BE shape |
| [easystock-frontend/components/products/columns.tsx](../../../components/products/columns.tsx) | List columns + cell formatters |
| [easystock-frontend/services/api/modules/products/](../../../services/api/modules/products/) | api.ts + hooks.ts + index.ts |
| [easystock-frontend/services/api/modules/variants/hooks.ts](../../../services/api/modules/variants/hooks.ts) | Variant-attribute hooks — invalidate `products.all()` |

### Default values (form-config.tsx)

| Field | Default |
|-------|---------|
| `status` | `ProductStatus.ACTIVE` |
| `sellingType` | `"retail"` |
| `taxType` | `"inclusive"` |
| `productType` | `"single"` |
| `enableUOMConversion` | `false` |

> `sku` does **not exist** on the single-product form, model, or validator — it has been fully removed. Do not re-add it. (The `base_sku` field that appears in `report.service.ts` / `dashboard.service.ts` is a legacy DB field used for reporting only — it is not part of the product form.)

> If a default isn't applying in the Add modal, the bug is almost certainly that `useCrudModal.handleAdd` is calling `form.reset(defaultValues)` with the prop-only defaults. The fix is already in place: `useDynamicForm` returns `mergedDefaults` and both `DataTable` and `DataCard` thread it into `useCrudModal`. Don't regress this.

### `unitId` autofill

Form-config has `unitId.copyValueTo: ["saleUnit.unitId"]` so picking a base unit prefills the sale unit (only matters when UOM is enabled — otherwise stripped by `prepareSubmitData`).

### Variant manager (variable products)

- Each variant row stores: `id`, optional `_id` (from BE), `attributeName`, `value`, `price`, `enabled`, `images`, `enableUOMConversion`, `purchaseUnit`, `saleUnit`.
- New variants seed `enableUOMConversion: false` and `saleUnit.unitId = baseUnitId, conversionFactor: 1`.
- Edit modal renders a `#edit-enable-uom` checkbox; when checked shows a 2×2 grid: Purchase Unit / Purchase CF / Sale Unit / Sale CF.
- Variant price input shows the **base unit label as suffix** (e.g. `/Piece`).
- The `useEffect` that syncs `value → variants` runs **only when `variants.length === 0`** — do not weaken this guard or edits get clobbered.
- **Select-all / deselect-all**: The table header "Active" column contains a master `Checkbox` with indeterminate support. Clicking it enables all when any are off; disables all when all are on. Derived with `variants.every(v => v.enabled)` / `variants.some(v => v.enabled)`.

### `prepareSubmitData` (helpers.ts) — must-do behaviour

1. Top-level `purchaseUnit`/`saleUnit` are **dropped entirely** when `!enableUOMConversion` OR `!saleUnit.unitId` OR `!purchaseUnit.unitId`. This is what fixes the `400 purchaseUnit.unitId: Required` regression caused by `copyValueTo` populating sale unit before UOM is enabled.
2. When `productType === "variable"`, the top-level `enableUOMConversion` field is **also excluded from FormData** — variable products manage UOM per-variant; the root field is irrelevant to the BE.
3. **Only active variants are sent**: `data.variants.filter(v => v.enabled)` runs before `.map()`. Inactive (unchecked) variants are excluded from the payload entirely.
4. Variants array is mapped: drop `costPrice`/`sku`/`barcode`; include `enableUOMConversion`; spread UOM fields **only when enabled** (`...(v.enableUOMConversion ? { purchaseUnit, saleUnit } : {})`). 
5. `variants` is sent as a single `FormData` field with a JSON-stringified value.
Maps BE detail → form values. For each variant maps `_id → id + _id`, copies `attributeName`, `value`, `price`, `enabled`, `images`, `enableUOMConversion`, `purchaseUnit`, `saleUnit`. **Without this, the edit modal renders empty UOM fields even though BE returned them.**

### Cross-resource invalidation

When categories / brands / units are mutated, the products list must refetch. This is wired via:

```ts
createResourceHooks({ ..., relatedQueryKeys: [queryKeys.products.all()] })
```

In:

- [services/api/modules/categories/hooks.ts](../../../services/api/modules/categories/hooks.ts)
- [services/api/modules/brands/hooks.ts](../../../services/api/modules/brands/hooks.ts)
- [services/api/modules/units/hooks.ts](../../../services/api/modules/units/hooks.ts)

Variant-attribute create/update/delete hooks also invalidate `queryKeys.products.all()` directly in their `onSuccess`.

---

## 4. UOM Rules Cheat Sheet

### Section-level hiding (how it works)

The entire **"UOM Conversion" section** in `form-config.tsx` carries:
```ts
dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" }
```
This means the section renders `null` when `productType !== "single"`. The `FormSection` type now supports `dependsOn?: FieldDependency` (added to [ui/components/form/type.ts](../../../ui/components/form/type.ts)), and `FormSectionComponent` in [ui/components/form/helper.tsx](../../../ui/components/form/helper.tsx) evaluates it via `evaluateFieldDependency` + `useWatch` before rendering.

The `enableUOMConversion` field's own `dependsOn` was **removed** — it is redundant since the parent section already hides when not single. Keep it that way.

| Scenario | UI | Payload |
|----------|----|----------|
| Single + UOM off | UOM section **visible** (productType=single), checkbox unchecked, purchase/sale fields hidden | No `purchaseUnit`/`saleUnit` sent (`prepareSubmitData` strips them) |
| Single + UOM on | UOM section visible, checkbox checked, 2×2 unit/CF grid shown | `{ enableUOMConversion: true, purchaseUnit: {unitId, conversionFactor}, saleUnit: {unitId, conversionFactor} }` on the parent |
| Variable | **Entire UOM section hidden** (section-level `dependsOn`) | No parent UOM fields sent; UOM lives per-variant |
| Variable variant + UOM off | Only price + base-unit suffix in variant edit modal | `{ enableUOMConversion: false }` (no purchase/sale objects) |
| Variable variant + UOM on | 2×2 grid in variant modal | `{ enableUOMConversion: true, purchaseUnit, saleUnit }` per variant |

---

## 5. Common Pitfalls / Debugging

| Symptom | Cause | Fix |
|---------|-------|-----|
| `400 purchaseUnit.unitId: Required` on single product create | `copyValueTo` filled `saleUnit.unitId` from base unit, leaving stale UOM payload while UOM toggle is off | `prepareSubmitData` strips top-level UOM when `!enableUOMConversion` — already in place |
| Root `enableUOMConversion` still in FormData for variable product | Variable products don't use root-level UOM | `prepareSubmitData` adds it to `skipUOMKeys` when `productType === "variable"` — already in place |
| Inactive/unchecked variants sent to BE | No filter before `.map()` | `prepareSubmitData` filters `data.variants.filter(v => v.enabled)` before mapping — already in place |
| FE PUT payload includes UOM, BE response missing `enableUOMConversion`/`purchaseUnit`/`saleUnit` on variant | **Mongoose model not re-registered** after schema edit (tsx watch hot-reloads service files but `mongoose.model()` is one-shot — old schema cached) | **Restart backend**: `kill <tsx-watch-pids>` then `pnpm dev`. Verify by direct API PUT round-trip. |
| Defaults (Active / Retail / Inclusive / Single) blank in Add modal | `useCrudModal` was resetting form to prop-only `defaultValues` | `useDynamicForm` now exposes `mergedDefaults`; both `DataTable` and `DataCard` pass it to `useCrudModal` — don't regress |
| Variant edit modal opens with UOM unchecked even when BE has it enabled | `transformEditData` not copying UOM keys on variants | Ensure each variant maps `enableUOMConversion`, `purchaseUnit`, `saleUnit` |
| Variant SKU / cost / barcode silently lost after save | Those fields were intentionally **removed** from the variant model + UI | Don't re-add — variants only carry: attributes, price, images, status, UOM |
| Single product form shows no SKU field | Correct — `sku` has been fully removed from the single-product form, model, and validator. The `base_sku` in report/dashboard services is a legacy read-only field. | Don't re-add `sku` to the form or model |
| UOM section still visible for variable product | `dependsOn` was applied at **field level** (on `enableUOMConversion`) instead of **section level** | Move `dependsOn` to the section definition itself — see Section 4 above |
| Products list still shows stale category/brand/unit name after edit | Missing cross-resource invalidation | Add `relatedQueryKeys: [queryKeys.products.all()]` to the resource's `createResourceHooks` |
| Category / brand / unit selects blank when opening edit | `projectListItem` trimmed the raw `categoryId`/`brandId`/`unitId` IDs — only nested objects remained, but DynamicForm selects look for raw ID strings | Add raw IDs back to `projectListItem` (they're already there now — don't remove them) |
| `Page 1 of undefined` on products list | List shape changed and dropped pagination meta | Don't change the response envelope — see [services/api/utils.ts](../../../services/api/utils.ts) |
| FE hits `/api/v1/products/...` and 401s | Wrong base URL | Use `/api/products/...` (no `v1`). The 401 in logs is from a stray dev call, not from production code paths. |

### Quick BE smoke test (browser console while logged in)

```js
const t = document.cookie.match(/auth-token=([^;]+)/)[1];
const fd = new FormData();
fd.append('productType', 'variable');
fd.append('variants', JSON.stringify([{ _id: '<variantId>', attributes: { Strength: '5mg' }, price: 10, status: 'active',
  enableUOMConversion: true,
  purchaseUnit: { unitId: '<unitId>', conversionFactor: 24 },
  saleUnit:     { unitId: '<unitId>', conversionFactor: 1 } }]));
const r = await fetch('http://localhost:5800/api/products/<productId>', {
  method: 'PUT', headers: { Authorization: 'Bearer ' + t }, body: fd
});
console.log((await r.json()).data.variants[0]);
```

If the returned variant lacks `enableUOMConversion`/`purchaseUnit`/`saleUnit` → backend restart needed (Mongoose schema cache).

---

## 6. Things NOT to do

- Don't reintroduce variant `sku` / `costPrice` / `barcode` / `weight` / `dimensions` — they were removed deliberately.
- Don't re-add `sku` to the single-product form, model, or validator — it has been fully removed.
- Don't show the parent UOM section for variable products — the section-level `dependsOn` hides it. Don't move the `dependsOn` back to individual fields.
- Don't add new `dependsOn` to `enableUOMConversion` field — the section hides it entirely; field-level `dependsOn` is redundant and was removed.
- Don't expand `projectListItem` without checking which FE columns/cards consume it.
- Don't bypass `prepareSubmitData` — it's the single place that normalizes the payload.
- Don't inline query keys for products — always `queryKeys.products.*`.
- Don't change the response envelope shape — frontend depends on `{ success, data, message, meta }`.
- Don't add `/v1` to FE product API paths.
