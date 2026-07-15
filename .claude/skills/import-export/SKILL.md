---
name: import-export
description: 'CSV import & export on the FRONTEND — the shared ImportDialog + ColumnMapper preview/commit flow, the `createImportApi` request pair, and the DataTable ExportDialog / DataTableExportConfig. USE WHEN: adding import or export to a list page, wiring a preview→map→commit flow, header-mismatch column mapping, showing import warnings/row errors, a dataset/column-preset export choice, "import silently skipped rows", "export missing columns", or the template download. Touches `easystock-frontend/{components/shared/import,components/shared/export,services/api/modules/import-api.ts,ui/components/dataTable,types/DataTable.ts}`. The CSV SPEC ENGINE (column definitions, feature-gated columns, warnings, preview-vs-commit semantics) is the BACKEND''s — read `easystock-backend/.claude/skills/import-export/SKILL.md`; this file does not duplicate it.'
---

# Import / Export Skill (Frontend)

The frontend for CSV: a shared import flow (preview → optional column-map → commit) and a shared export
dialog. Both are thin — the column spec, validation and warnings are the backend's; the FE drives the
UX and renders the result.

> **The spec engine is NOT here.** Column definitions, feature-gated columns, `ImportResult.warnings`
> (visible soft-skips) and the preview-vs-commit contract live in
> [`easystock-backend/.claude/skills/import-export/SKILL.md`](../../../../easystock-backend/.claude/skills/import-export/SKILL.md)
> (`src/export-import/`). Read it before changing what a column means.

---

## 1. Import — the request pair

Spread `createImportApi("/<resource>")`
([`services/api/modules/import-api.ts`](../../../services/api/modules/import-api.ts)) into a resource's
`api.ts`. It gives two calls to the same endpoint with a mode flag:

```ts
importPreview(file, mapping?)  // POST /<resource>/import?mode=preview  → ImportResult (no writes)
importCommit(file, mapping?)   // POST /<resource>/import?mode=commit   → ImportResult (writes)
```

Both send `multipart/form-data` (`file` + optional JSON `mapping`). **Preview never writes** — it
returns the header-resolution report and would-be row outcomes so the user can confirm before commit.

---

## 2. Import — the shared UI

- [`components/shared/import/import-dialog.tsx`](../../../components/shared/import/import-dialog.tsx) —
  the file-pick → preview → (map) → commit flow.
- [`components/shared/import/column-mapper.tsx`](../../../components/shared/import/column-mapper.tsx) —
  shown when the CSV headers don't match the template. It reads the preview's `ImportHeaderInfo`
  (`csvHeaders` + per-column `matched`) and lets the user map each expected column to a CSV header; the
  chosen `expected → csvHeader` overrides ride the commit as `ImportColumnMapping`
  (`Record<string, string>`).

Wire it into a list via `DataTableImportConfig` (`importConfig` on the DataTable). **Render
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
- Don't re-implement the import/export dialog per resource — spread `createImportApi` and pass
  `importConfig` / `exportConfig`.
- Don't invent column semantics on the FE — the spec is the backend's.
