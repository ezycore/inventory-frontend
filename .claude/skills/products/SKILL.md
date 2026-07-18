---
name: products
description: 'Build, edit, debug, or audit the EzyCore Products feature on the FRONTEND (list page + DynamicForm config + variant manager + helpers + TanStack Query hooks + cross-resource invalidation). USE WHEN: creating/editing single (`SINGLE`), variable (`VARIABLE`) or combo (`COMBO`) products, per-variant UOM conversion (enableUOMConversion + purchaseUnit + saleUnit), troubleshooting "purchaseUnit.unitId Required" 400s, variant fields silently dropped after save, edit modal not pre-filling variants, defaults (status=active, sellingType=retail, productType=single, enableUOMConversion=false) not applying, related-resource changes (categories/brands/units/variant-attributes) not refreshing the products list, list response too verbose. Touches `inventory-frontend/{app/(protected)/products,components/products,services/api/modules/products,services/api/modules/variants}`. For the BACKEND (models, validators, service, endpoints, combo rules) read `inventory-backend/.claude/skills/products/SKILL.md` — this file does not duplicate it.'
---

# Products Skill (Frontend)

Frontend map of the **Products** resource: list page → form config → variant manager → API hooks →
cross-resource invalidation, plus default values, UOM rules, and the recurring pitfalls.

> **The backend is NOT documented here.** It lives in
> [`inventory-backend/.claude/skills/products/SKILL.md`](../../../../inventory-backend/.claude/skills/products/SKILL.md)
> — the model, the validator's cross-field rules, the full endpoint table, the combo invariants, and
> the list projection this app prefills its edit form from. Read it before changing anything that
> crosses the wire.
>
> Until 2026-07-13 this file carried its own copy of all that, and it had gone stale in four ways:
> it named a route file that doesn't exist, listed 6 of the 15 endpoints, described a tax shape that
> had been replaced, and told you to delete a variant field that had since been re-added. One copy
> now, in the repo that owns the code.

---

## 1. Conceptual Model

A **Product** is one of **three** types:

| productType | Variants | UOM conversion location |
|-------------|----------|--------------------------|
| `single`   | none — sold as a single SKU                                      | on the **product** itself (`enableUOMConversion`, `purchaseUnit`, `saleUnit`) |
| `variable` | 1..N rows in `VariantProduct` collection, one per attribute combo | on **each variant** (per-variant UOM, parent UOM hidden in UI) |
| `combo`    | none — a fixed bundle of other (non-combo) products               | none — the backend clears UOM on combos |

Multi-tenant: every doc is scoped by `organizationId`. Never trust org/loc from the request body.

---

## 2. The Backend Contract

The model, validator rules, endpoint table, combo invariants and response shapes are documented once,
in the repo that owns them:
**[`inventory-backend/.claude/skills/products/SKILL.md`](../../../../inventory-backend/.claude/skills/products/SKILL.md)**.

Three things from it that this app's code directly depends on:

1. **The edit modal prefills from the list row — there is no `GET /:id` before opening it.** So the
   backend's slim list projection (`projectListItem`) is a *contract*, not an optimization. If a field
   disappears from it, the edit form renders that field blank and the next save can wipe the stored
   value. When a select goes blank on edit, check the projection first.
2. **Tax is per-side**: `salesTax` and `purchaseTax`, each `{ taxId, taxType, rate, taxName }`. There
   is no flat top-level `taxId`/`taxType`. The rate arrives resolved — don't fetch it separately.
   The FE/BE tax math must agree bit-for-bit; see
   [`inventory-backend/docs/features/tax.md`](../../../../inventory-backend/docs/features/tax.md).
3. **UOM requires *at least one* of purchase/sale unit** when `enableUOMConversion` is true — not both.
   Any side you *do* send must be complete (`unitId` + `conversionFactor`, factor > 0).

> **Use `/api/products/...` — NOT `/api/v1/...`. Don't add `v1` to FE calls.**

---

## 3. Frontend Files Map

| File | Purpose |
|------|---------|
| [inventory-frontend/app/(protected)/products/page.tsx](../../../app/(protected)/products/page.tsx) | DataTable wiring + `transformEditData` |
| [inventory-frontend/components/products/form-config.tsx](../../../components/products/form-config.tsx) | DynamicForm field config + defaults + dependsOn |
| [inventory-frontend/components/products/variant-manager.tsx](../../../components/products/variant-manager.tsx) | Per-variant UI (table + edit modal with UOM) |
| [inventory-frontend/components/products/helpers.ts](../../../components/products/helpers.ts) | `prepareSubmitData` — strips inapplicable UOM, maps variants to BE shape |
| [inventory-frontend/components/products/columns.tsx](../../../components/products/columns.tsx) | List columns + cell formatters |
| [inventory-frontend/services/api/modules/products/](../../../services/api/modules/products/) | api.ts + hooks.ts + index.ts |
| [inventory-frontend/services/api/modules/variants/hooks.ts](../../../services/api/modules/variants/hooks.ts) | Variant-attribute hooks — invalidate `products.all()` |

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
This means the section renders `null` when `productType !== "single"`. The `FormSection` type now supports `dependsOn?: FieldDependency` (added to [ui/components/form/type.ts](../../../ui/components/form/type.ts)), and `FormSectionComponent` in [ui/components/form/form-section.tsx](../../../ui/components/form/form-section.tsx) evaluates it via `evaluateFieldDependency` + `useWatch` before rendering.

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
| Variant SKU / cost silently lost after save | Those fields were intentionally **removed** from the variant model + UI | Don't re-add — variants carry: attributes, price, images, status, UOM, **barcode** |
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

- Don't reintroduce variant `sku` / `costPrice` / `weight` / `dimensions` — they were removed deliberately.
  **`barcode` is NOT in that list** — it was removed once and then deliberately re-added (with
  `barcodeSymbology`) by the barcode feature. Variants carry a scannable code. Don't delete it.
- Don't re-add `sku` to the single-product form, model, or validator — it has been fully removed.
- Don't show the parent UOM section for variable products — the section-level `dependsOn` hides it. Don't move the `dependsOn` back to individual fields.
- Don't add new `dependsOn` to `enableUOMConversion` field — the section hides it entirely; field-level `dependsOn` is redundant and was removed.
- Don't expand `projectListItem` without checking which FE columns/cards consume it.
- Don't bypass `prepareSubmitData` — it's the single place that normalizes the payload.
- Don't inline query keys for products — always `queryKeys.products.*`.
- Don't change the response envelope shape — frontend depends on `{ success, data, message, meta }`.
- Don't add `/v1` to FE product API paths.
