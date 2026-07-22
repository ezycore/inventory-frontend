---
name: vat
description: 'VAT (Bangladesh) on the FRONTEND — the `isVatActive` gate, the tax preview math that must match the backend bit-for-bit, the shared tax presentation components, the VAT settings page, and the VAT report. USE WHEN: touching anything tax/VAT-shaped in the UI — cart tax lines, product tax fields, the VAT settings or rates screens, the VAT report, receipt/invoice tax rows, or the nav/breadcrumb labels for them. Symptoms: "tax column shows when the feature is off", "FE total differs from the saved total by a paisa", "a reduced-rate org is shown a rebate", "breadcrumb still says Tax", "zero-rated and exempt look the same". Touches `lib/feature-utils.ts`, `utils/tax.ts`, `components/shared/{tax-summary-lines,line-tax-cell}.tsx`, `app/(protected)/settings/tax/page.tsx`, `components/reports/tax-report.tsx`, `constants/navItem.ts`. **MUST be updated whenever the gate, the preview math or the VAT UI changes — and `SaleUtils.applyLineTaxes` in the backend must change in lockstep.**'
---

# VAT (Frontend) — SKILL

> Verified against source 2026-07-20.
>
> **The contract is backend-owned and written once.** The registration model, the write gate, the
> cost basis, categories and the report rules live in `inventory-backend/.claude/skills/vat/SKILL.md`
> and `inventory-backend/docs/features/vat.md`. This skill covers only what is *frontend-specific*
> and does not restate them.

---

## 1. The gate — `isVatActive(org)`, no area argument

`lib/feature-utils.ts` mirrors the backend `resolveOrgVat(...).chargesLineVat`:

| Helper | Answers |
|---|---|
| `isVatActive(org)` | does this org put VAT on its invoices? — **the gate for every VAT surface** |
| `claimsInputRebate(org)` | may it reclaim input VAT? — **a different question** |
| `vatRegistrationOf(org)` | the registration in force today |
| `resolveVatRegistration(history, date)` | the registration on a given date |

**It replaced `isTaxActive(org, "sales" \| "purchase")`.** There is no per-area argument any more:
registration is a property of the organization, so sales and purchases share one answer. If you find
`isTaxActive` anywhere, it is stale.

Two traps carried from the backend:
- **`turnover_4` returns `false`** — a turnover taxpayer issues invoices with no VAT line at all.
- **`reduced` charges VAT but cannot reclaim it.** Never derive the rebate from `isVatActive`.

⚠️ `vatRegistrationOf` has a **temporary bridge**: feature ON + no declared history ⇒
`standard_15`. The backend has the identical branch. **Delete both together**, never one.

When the gate is off: hide VAT UI and columns, and neutralize VAT in previews — do not just grey it.

---

## 2. Math only through `utils/tax.ts`

| Function | Use |
|---|---|
| `computeOrderTax` | cart rollups → `addedTax` / `includedTax` / `taxTotal` / `grandTotal` |
| `computeLineTax` | one line |
| `splitLineTax` | added-vs-included from a **posted** document's stored snapshot (detail/receipt views) |

🔗 **These are a preview of a number the server will persist.** They must match
`SaleUtils.applyLineTaxes` **bit-for-bit** — if they disagree by a paisa, the total jumps the moment
the user hits save. Change one side, change the other, and update both tests (`utils/tax.test.ts`
here, `tax-contract.test.ts` there).

Never re-derive tax inline, and never recompute it from a posted document's totals — read the stored
line snapshot via `splitLineTax`.

---

## 3. Presentation — shared components only

| Component | Use |
|---|---|
| `<TaxSummaryLines>` (`components/shared/tax-summary-lines.tsx`) | the "VAT (added) / Total / Includes … in price" summary |
| `<LineTaxCell>` (`components/shared/line-tax-cell.tsx`) | the cart per-line VAT column |

Both are used in more than one place — extend them rather than copying markup.

---

## 4. The VAT settings page

`app/(protected)/settings/tax/page.tsx` (**route kept as `/settings/tax`** — renaming it would break
bookmarks and every `covers_routes` entry, for no user benefit).

Three cards: **Registration** (type + effective date + BIN + a live rebate explainer), **Prices**
(`pricesIncludeVat`), **Filing** (period is fixed at one calendar month; only the due day is
editable).

Two rules the UI must keep:
- The **effective date field only appears when the type actually changes** — every send appends a
  history entry, and the history is the audit trail.
- There is **no financial-year setting** anywhere. It was removed 2026-07-21 (nothing read it), and
  it would not belong on this page regardless — the VAT period is always a calendar month.

---

## 5. The report explainer is conditional

`components/reports/tax-report.tsx` must pick `explainerStandard` vs `explainerNoRebate` from
`data.input.recoverable`, and show the "not reclaimable — this VAT is part of your cost" line when it
is false.

**This is the original bug in UI form:** the text asserted `output − input` unconditionally, so a
reduced-rate shop read that it had a rebate it cannot claim. The backend was fixed first; the string
lied for a while afterwards.

---

## 6. Which rate a new product starts with

Three sources, most specific first: the product's own `taxId` → its **category's** `defaultTaxId` →
the org-wide `Tax.isDefault`.

Only the middle one is frontend logic: **`components/products/use-category-vat-prefill.ts`**, wired
through the DataTable's `operations.onFieldChange` (which hands the caller the form, so it has
`setValue` — the form is created inside the DataTable).

Four rules, each load-bearing:

- **Create only.** `form.getValues("_id")` short-circuits it. Re-categorising an existing product must
  never silently re-price it.
- **It overwrites.** The rate field auto-fills `Tax.isDefault` via `defaultFlag` as soon as its options
  load — before the user scrolls to it. A "fill only when empty" rule would mean the category default
  never applied at all.
- **Both `salesTax.taxId` and `purchaseTax.taxId`** from one category field. A supply's VAT category
  belongs to the good, not the direction it moves.
- **`CATEGORY_OPTIONS_API` is exported from `components/products/form-config.tsx` and shared.** The URL
  *is* the TanStack cache key, so drift between the picker and the prefill would double the request
  and let the prefill read options with no `defaultTaxId` on them — a silent no-op.

The category form's picker is in `components/categories/form-config.ts`; the categories **page** drops
the field when `isVatActive` is false. `prepareSubmitData` must keep appending `defaultTaxId` — it
hand-builds `FormData`, so a field it forgets is simply never sent.

⚠️ `AdvancedSelect` has no clear affordance, so a category default can be changed but not removed from
the UI. The wire format supports it (`""` → `null`).

**Changing a category's default does NOT re-price its existing products** — inheritance is a copy at
create time. The action that does is `<ApplyVatDialog>` (`components/categories/apply-vat-dialog.tsx`),
offered on the category row in **both** the table and the card view. The card view is this page's
default, so an action wired only into `customActions` would be invisible to most users — `renderCard`
takes a fully custom renderer and DataCard's `customActions` never reach it.

**Invalidation:** mutations that change an options list invalidate the `["select-options"]` **prefix**,
not each URL. The per-URL literals in `services/api/modules/*/hooks.ts` silently stop matching the
moment a picker's `fields=` changes — it had already happened to both categories and taxes. Categories
and taxes now use the prefix; the other modules still list literals.

---

## 7. Labels: nav constants are identity, not display

`constants/navItem.ts` titles are the **message-key source** (`navLabelKey`), the permission/feature
filter keys and the kbar keywords. Everything that renders one goes through
`useNavLabels().itemLabel()` — sidebar, kbar **and breadcrumbs**.

**Renaming a nav title renames its message key.** "Tax Settings" → "VAT" moved the lookup from
`items.tax-settings` to `items.vat`; the `layout.json` key must be renamed in **both locales** in the
same commit, or the fallback quietly serves English and nothing fails.

Bangla keeps `কর` for four terms where it is the correct statutory word — **টার্নওভার কর**,
**কর মেয়াদ**, **কর চালানপত্র**, **কর কর্তৃপক্ষ**. Do not blanket-replace `কর` → `ভ্যাট`.

---

## 8. Change checklist

1. Gating a new surface? → `isVatActive(org)`, not the `tax` feature flag alone.
2. Touching `utils/tax.ts`? → change `applyLineTaxes` in the backend and both test files.
3. Adding a VAT string? → EN **and** BN in the same commit, and check `docs/help/**` quotes
   (`pnpm help:verify` fails the build on a renamed label a help page cites).
4. Backend DTO changed? → `pnpm gen:api-types`, then `pnpm verify`.
5. Renaming a nav title? → rename the `layout.nav.items.*` key too, both locales.
6. Adding a field to a category/product form that posts multipart? → append it in that resource's
   `prepareSubmitData`, or it silently never reaches the API.

---

## 9. Traps table

| Symptom | Cause | Fix |
|---|---|---|
| VAT column shows with the feature off | gated on `features.tax` instead of `isVatActive` | §1 |
| Reduced-rate org shown a rebate | used `isVatActive` where `claimsInputRebate` was needed | §1, §5 |
| Total jumps on save | preview drifted from `applyLineTaxes` | §2 |
| Category default rate never applies | prefill declined to overwrite, or the two option URLs drifted | §6 |
| A form field is never saved | not appended in `prepareSubmitData` | §6 |
| Breadcrumb still English | rendering `navItem.title` raw instead of `itemLabel` | §7 |
| Sidebar label reverted to English after a rename | `layout.nav.items.*` key not renamed with the title | §7 |
| Zero-rated and exempt look identical | reading only the rate; the category is on the line snapshot | the backend `vat` skill §4 |
