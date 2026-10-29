---
name: import-export
description: 'CSV import & export on the FRONTEND — the shared ImportDialog + ColumnMapper preview/commit flow, the `createImportApi` request pair, and the DataTable ExportDialog / DataTableExportConfig. USE WHEN: adding import or export to a list page, wiring a preview→map→commit flow, header-mismatch column mapping, showing import warnings/row errors, a dataset/column-preset export choice, "import silently skipped rows", "export missing columns", or the template download. Touches `inventory-frontend/{components/shared/import,components/shared/export,services/api/modules/import-api.ts,ui/components/dataTable,types/DataTable.ts}`. The CSV SPEC ENGINE (column definitions, feature-gated columns, warnings, preview-vs-commit semantics) is the BACKEND''s — read `inventory-backend/.claude/skills/import-export/SKILL.md`; this file does not duplicate it.'
---

# Import / Export Skill (Frontend)

The frontend for CSV: a shared import flow (preview → optional column-map → commit) and a shared export
dialog. Both are thin — the column spec, validation and warnings are the backend's; the FE drives the
UX and renders the result.

> **The spec engine is NOT here.** Column definitions, feature-gated columns, `ImportResult.warnings`
> (visible soft-skips) and the preview-vs-commit contract live in
> [`inventory-backend/.claude/skills/import-export/SKILL.md`](../../../../inventory-backend/.claude/skills/import-export/SKILL.md)
> (`src/export-import/`). Read it before changing what a column means.

---

## 1. Import — the request pair

Spread `createImportApi("/<resource>")`
([`services/api/modules/import-api.ts`](../../../services/api/modules/import-api.ts)) into a resource's
`api.ts`. It gives two calls to the same endpoint with a mode flag:

```ts
importPreview(file, mapping?, options?)  // POST /<resource>/import?mode=preview  → ImportResult (no writes)
importCommit(file, mapping?, options?)   // POST /<resource>/import?mode=commit   → ImportResult (writes)
```

Both send `multipart/form-data` (`file` + optional JSON `mapping` + `autoCreate=true` /
`mirrorImages=true` when those `ImportOptions` are on). **Preview never writes** — it returns the
header-resolution report and would-be row outcomes so the user can confirm before commit. Send the
same options to both: `autoCreate` changes what the preview counts as valid.

---

## 2. Import — the shared UI

- [`components/shared/import/import-dialog.tsx`](../../../components/shared/import/import-dialog.tsx) —
  the file-pick → preview → (map) → commit flow. Its read-only result block (counts, notes, row
  errors) is [`import-result.tsx`](../../../components/shared/import/import-result.tsx).
- [`components/shared/import/import-options.tsx`](../../../components/shared/import/import-options.tsx) —
  the opt-in switches, shown only for what `DataTableImportConfig.options` offers (products offer
  both). Toggling "Create missing…" marks the preview stale until re-checked; "Copy product images"
  only affects the commit, and defaults ON when the preview's `dialect` is `"woocommerce"` until
  the merchant touches it.
- [`components/shared/import/column-mapper.tsx`](../../../components/shared/import/column-mapper.tsx) —
  shown when the CSV headers don't match the template. It reads the preview's `ImportHeaderInfo`
  (`csvHeaders` + per-column `matched`) and lets the user map each expected column to a CSV header; the
  chosen `expected → csvHeader` overrides ride the commit as `ImportColumnMapping`
  (`Record<string, string>`).

**Where imports and exports live (since 2026-10-29): the Import & Export center**,
[`app/(protected)/import-export/page.tsx`](../../../app/(protected)/import-export/page.tsx) — not the list
pages (owner decision, backend `docs/plan/import-export-center.md`). A new importable resource is one
row in `IMPORTS` in [`components/import-export/use-import-export-access.ts`](../../../components/import-export/use-import-export-access.ts)
(its permission, the feature its write route checks, the `DataTableImportConfig`, and a `*.imported`
event in `services/api/invalidation.ts`); the card, the dialog and the gating follow. An exportable
file is an `ExportCard` in `components/import-export/export-tab.tsx`, fed the list page's own
`get*FilterConfig(t)` so an export means what the list's filter meant. The History tab reads
`GET /api/import-batches` (`useImportBatches`).

`DataTableImportConfig` / `importConfig` on a DataTable still works (the dialog is the same). **Render
`ImportResult.warnings`** — they are *visible soft-skips* (a row imported minus one field, or was
skipped for a stated reason). Swallowing them hides real data loss. `errors` is capped server-side;
`invalid` is the true failed count.

Types (`ImportResult`, `ImportColumnMapping`, `ImportHeaderInfo`, `ImportRowError`) live in
[`types/DataTable.ts`](../../../types/DataTable.ts) and mirror the backend.

---

## 3. Export — the shared dialog

Give a list an `exportConfig: DataTableExportConfig` (`ui/components/dataTable`,
[`components/shared/export/export-dialog.tsx`](../../../components/shared/export/export-dialog.tsx)):

```ts
interface DataTableExportConfig {
  download: (params) => Promise<void>;   // calls the resource's export endpoint
  label?: string;                        // default "Export CSV"
  note?: string;                         // caveat line in the confirm dialog (e.g. scope note)
  options?: ExportOption[];              // dataset / column-preset choices (default All/Essential)
}
```

Export is **synchronous with a confirm + spinner** (no background queue). `options[]` is the flexible
choice-list — use it when a resource offers datasets (e.g. inventory current-stock vs batch/expiry) or
column presets; feature-gated datasets should only appear when the feature is on. The `note` line is
where scope caveats go (active-location only, single-filter, etc.).

Template download for import is its own endpoint (e.g. inventory `downloadImportTemplate`) — surface it
from the import dialog.

---

## 4. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Rows silently missing after import | `warnings` not rendered | show `ImportResult.warnings`; they are soft-skips, not noise |
| Import writes on preview | called `importCommit` for preview | preview = `mode=preview`, never writes |
| Column mapper never appears | headers matched, or `ImportHeaderInfo` ignored | it shows only on mismatch; drive it from the preview report |
| Export missing a dataset's columns | wrong `options` / feature-gated dataset hidden | add the `ExportOption`; gate feature datasets on the flag |
| Export dumps everything with no confirm | bypassed `ExportDialog` | route through `exportConfig.download` (confirm + spinner) |

---

## 5. Things NOT to do

- Don't hide `ImportResult.warnings` — they signal real, visible skips.
- Don't write on preview — the two modes are the whole safety contract.
- Don't re-implement the import/export dialog per resource — spread `createImportApi` and add the
  resource to the Import & Export center.
- Don't put Import / Export buttons back on a list page: they were removed on purpose, and the help
  guides send merchants to the center.
- Don't invent column semantics on the FE — the spec is the backend's.
