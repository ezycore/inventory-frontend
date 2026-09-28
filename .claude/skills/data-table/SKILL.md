---
name: data-table
description: 'Build, edit, debug, or audit list pages in EzyCore frontend that use the self-contained DataTable component (TanStack Table + TanStack Query + DynamicForm). USE WHEN: creating a new resource list page (brands/products/customers/...), wiring CRUD via the `operations` prop, adding/editing columns, configuring filters (text/select/date/date-range), enabling row selection + bulk delete, switching between server-side and client-side pagination, configuring server-side sorting (`sortingConfig`), enabling column visibility or `manageColumns` (column-settings dialog), customizing table style (variant/zebra/borderless/headless/sticky/rounded rows), adding cell actions / header actions / link buttons via `customActions`, swapping default Edit modal for navigation, formatting cells via `AvatarCell` / `DateCell`, troubleshooting "Page 1 of undefined", "page off-by-one", queryKey not invalidating, file uploads via `prepareSubmitData`, edit form not pre-filling, sort not hitting backend, custom Add button not appearing. Touches files under ui/components/dataTable/, types/DataTable.ts, hooks/use-crud-handlers.ts, ui/components/filters/.'
---

# DataTable Skill

Self-contained list table built on **TanStack Table v8 + TanStack Query v5 + DynamicForm**. Pass `operations` (data fetcher + mutations + form config) and the table handles fetching, paging, filtering, sorting, CRUD modals, bulk delete, error UI, URL filters, and column settings — all internally.

## When to Use
- Creating any resource list/CRUD page (`app/(protected)/<resource>/page.tsx`)
- Adding columns / cells (Avatar, Date, badges, custom renderers)
- Wiring filters (text, select, date, date-range) via `filterConfig`
- Server-side sorting via `sortingConfig.sortOptions`
- Enabling row selection + bulk delete (`selectable` + `bulkDeleteMutation`)
- Replacing default action buttons with navigation / custom actions (`customActions`)
- Switching to a non-self-contained mode (pass `data` + omit `operations.getAllData`)
- Customizing table look (variant, zebra, borderless, headless, sticky header, rounded rows)
- Hooking the `manageColumns` user-settings dialog
- Debugging pagination off-by-one, "Page 1 of undefined", queryKey cache misses, edit form not pre-filling

## Files Map (read these before editing)

| File | Purpose |
|------|---------|
| [ui/components/dataTable/index.tsx](ui/components/dataTable/index.tsx) | `DataTable` — wraps query, filters, pagination, CRUD modal |
| [ui/components/dataTable/base-data-table .tsx](ui/components/dataTable/base-data-table%20.tsx) | `BaseDataTable` — TanStack Table instance, toolbar/body/pagination glue |
| [ui/components/dataTable/columns.tsx](ui/components/dataTable/columns.tsx) | `useEnhancedColumns` — injects selection + actions columns, applies `serverSortableFields` |
| [ui/components/dataTable/toolbar.tsx](ui/components/dataTable/toolbar.tsx) | Search input, bulk-delete, column visibility, GlobalFilter, header customActions, Add button |
| [ui/components/dataTable/table-body.tsx](ui/components/dataTable/table-body.tsx) | Header (sort icons), body, loading spinner, empty state, row styling |
| [ui/components/dataTable/pagination.tsx](ui/components/dataTable/pagination.tsx) | Page size select + total label; the pager itself is the shared `<PaginationControls>` |
| [ui/components/pagination-controls.tsx](ui/components/pagination-controls.tsx) | **Shared** first/prev/numbers/next/last row — used here AND by the hand-rolled ecommerce list pages' `ListPagination`. Extend this, never fork a second pager |
| [utils/page-window.ts](utils/page-window.ts) | `pageWindow(page, totalPages, maxVisible?)` — which numbers to show and where the "…" fall. Pure + tested |
| [ui/components/dataTable/hooks.ts](ui/components/dataTable/hooks.ts) | `usePaginationState`, `useDeleteDialog` |
| [ui/components/dataTable/cells/avatar-cell.tsx](ui/components/dataTable/cells/avatar-cell.tsx) | `AvatarCell` (image/icon + name + active/inactive color) |
| [ui/components/dataTable/cells/date-cell.tsx](ui/components/dataTable/cells/date-cell.tsx) | `DateCell` (timezone-aware via `useAuthStore`) |
| [types/DataTable.ts](types/DataTable.ts) | All public types: `DataTableProps`, `Operations`, `FilterConfig`, `SortingConfig`, `CustomAction`, `DataTableAction`, `TableVariant`, `RowSpacing`, `DataTableSearchConfig` |
| [hooks/use-crud-handlers.ts](hooks/use-crud-handlers.ts) | `useCrudModal` — modal open/close + edit/view state |
| [hooks/use-url-filters.ts](hooks/use-url-filters.ts) | Reads initial filter values from URL search params |
| [ui/components/filters/global-filter.tsx](ui/components/filters/global-filter.tsx) | Drawer/popover that renders `FilterField`s |
| [components/shared/column-settings-dialog.tsx](components/shared/column-settings-dialog.tsx) | Per-user column visibility (used when `manageColumns` + `module` set) |
| [ui/components/dataTable/datatable-doc.md](ui/components/dataTable/datatable-doc.md) | Long-form reference (1300+ lines) |

## Procedure: Add a new resource list page

1. Build `columns` (`ColumnDef<T>[]`) — keep `accessorKey` matching the API field for sorting/search.
2. Build `formConfig` (`DynamicFormConfig`) using the dynamic-form skill.
3. Build `filterConfig` (`FilterConfig`) — fields, `viewMode: 'popover' | 'drawer'`, `columns: 1|2|3|4`.
4. Memoize a `sharedOperations` object so the same instance is reused if you swap to `DataCard` later:
   ```ts
   const sharedOperations: Operations<Brand> = {
     getAllData: (params) => brandService.getAll(params),
     queryKey: queryKeys.brands.all(),       // from services/api/query-keys.ts
     formConfig: brandFormConfig,
     defaultValues: { name: "", status: "active" },
     createMutation: useCreateBrand(),
     updateMutation: useUpdateBrand(),
     deleteMutation: useDeleteBrand(),
     bulkDeleteMutation: useBulkDeleteBrands(), // optional
     entityName: "Brand",
     isViewAvailable: true,
     openInside: "modal",                      // or "drawer"
     transformEditData: (item) => ({ ...item, logo: item.logo_url ? [item.logo_url] : [] }),
     prepareSubmitData: (data, isEdit) => buildFormData(data, isEdit),
     disabledFieldsInEdit: ["slug"],
   };
   ```
5. Render:
   ```tsx
   <DataTable
     cardTitle={(n) => `All Brands (${n})`}
     columns={columns}
     filterConfig={brandFilterConfig}
     searchConfig={{ globalSearch: true, placeholder: "Search..." }}
     sortingConfig={{ sortOptions: [{ field: "name", label: "Name" }, { field: "createdAt", label: "Created" }], defaultSortBy: "createdAt", defaultSortOrder: "desc" }}
     selectable
     enableSorting
     manageColumns module="brand"
     defaultPageSize={10}
     pageSizes={[10, 20, 50, 100]}
     operations={sharedOperations}
   />
   ```
6. The page Add button, edit/view/delete icons, modal title, submit label, query invalidation are all auto-derived from `operations`. Don't reimplement them.

## Procedure: Wire `operations` (CRUD) — what each field does

| Field | Effect |
|-------|--------|
| `getAllData(params)` | Fetcher. Receives `{ page, limit, ...filters, sort_by?, sort_order? }` (page is **1-based**). |
| `queryKey` | Base TanStack key. Final key is `[...queryKey, { page, limit, ...filters, sort_by, sort_order }]` — **single object, not spread args**. |
| `createMutation` / `updateMutation` / `deleteMutation` / `bulkDeleteMutation` | Mutation hook results. Presence enables corresponding UI (Add button, Edit/Delete icons, bulk delete). Each must invalidate `queryKey` in its own `onSuccess`. |
| `formConfig` + `defaultValues` | Passed to internal `DynamicForm`. |
| `entityName` | Drives labels: `Add {entityName}`, `Edit {entityName}`, `Delete {entityName}`, `{entityName} Details`. |
| `isViewAvailable` | Shows the View (eye) icon. View mode = read-only DynamicForm (`viewMode={true}`). |
| `editTooltip` / `deleteTooltip` / `viewTooltip` | Override default action tooltips. |
| `transformEditData(item)` | Convert API item → form values (e.g. URL → `[url]` for file-upload). |
| `prepareSubmitData(data, isEdit, item)` | Convert form values → backend payload. **`id` is auto-injected** for edits (object or FormData). Return `FormData` for file uploads. |
| `openInside` | `"modal"` (default) or `"drawer"`. |
| `disabledFieldsInEdit` | Lock immutable fields in edit mode (e.g. `["slug","email"]`). |

## Procedure: Sorting (server-side)

1. Pass `sortingConfig.sortOptions: [{ field, label }, ...]`. Only listed fields become sortable.
2. Internally `manualSorting` flips on; clicks emit `sort_by` + `sort_order` to `getAllData` and reset to page 1.
3. Backend must accept `sort_by` and `sort_order` query params.
4. Without `sortingConfig`, sorting is **client-side** (TanStack `getSortedRowModel`) over the current page only.

## Procedure: Filters

1. Define `filterConfig.fields: FilterField[]` with `name` matching backend query param.
2. Filter values are sent flat (`?status=active`); objects (date-range) are JSON-serialized by `lib/api-client.ts` (`?createdAt={"from":"...","to":"..."}`).
3. Initial values come from URL (`useUrlFilters`).
4. Apply/Reset auto-reset `page` to 1.

## Procedure: Custom actions / replace default Edit

`customActions: CustomAction[]` are merged into the toolbar (`placement: "header"`) or each row (`placement: "cell"`).

```ts
// Override built-in edit (still uses Edit icon, but navigates instead of opening modal)
customActions={[
  { type: "edit", placement: "cell", onClick: (row) => router.push(`/brands/${row._id}/edit`) },
  // Add a header link instead of the default Add button
  { type: "create", placement: "header", label: "Add Brand", icon: <Plus className="h-4 w-4" />, href: "/brands/new" },
  // New row button
  { type: "duplicate", placement: "cell", icon: <Copy className="h-4 w-4" />, tooltip: "Duplicate", onClick: (row) => duplicate(row._id) },
]}
```

Notes:
- Built-in cell actions render only when `actions` allows them (i.e. `updateMutation`/`deleteMutation`/`isViewAvailable` provided).
- `customActions` with `type: "create"` + `placement: "header"` **overrides** the auto-generated Add button.
- `disabled` may be a function: `disabled: (row) => row.status === "archived"`.

## Procedure: Self-contained vs external data

- **Self-contained** (preferred): pass `operations.getAllData` + `operations.queryKey`. Pagination is server-side (`manualPagination: true`, `pageCount = totalPages`).
- **External data**: pass `data={items}` and **omit** `operations.getAllData`. Pagination becomes client-side (TanStack `getPaginationRowModel`). Use only for small datasets.

## Procedure: Cells

```tsx
{ accessorKey: "name", header: "Brand", cell: ({ row }) => (
  <AvatarCell imageUrl={row.original.logo_url} name={row.getValue("name")} isActive={row.original.status === "active"} />
) }
{ accessorKey: "createdAt", header: "Created", cell: ({ row }) => <DateCell value={row.getValue("createdAt")} isShowDateOnly={false} /> }
```
`DateCell` reads timezone from `useAuthStore.getState().user?.organization?.timezone` — server components must hydrate auth first.

## Critical Conventions (DO / DON'T)

- **DO** type rows as `{ _id: string; ... }` (constraint on `DataTable<TData>`).
- **DO** put `entityName` on `operations` — half the auto labels rely on it.
- **DO** invalidate `queryKey` inside each mutation hook's `onSuccess` (TanStack v5 syntax).
- **DO** use `prepareSubmitData` to build `FormData` for file uploads. Backends must read `multipart/form-data`.
- **DO** memoize `formConfig` / `columns` / `operations` — every re-render rebuilds the schema otherwise.
- **DON'T** spread pagination/filters as separate queryKey args — internal code uses one object.
- **DON'T** manually inject `id` for edit — DataTable adds `id: editingItem._id` to objects and `formData.append("id", _id)` to FormData if missing.
- **DON'T** convert `page` to 0-based for the backend — DataTable already passes 1-based; the only conversion happens at TanStack boundary.
- **DON'T** call `res.json()` styled access in `cell`; use `row.getValue("field")` or `row.original.field`.
- **DON'T** use `enableSorting` to enable server sort; that's `sortingConfig`. `enableSorting={false}` only disables client headers' sort UI.

## Row selection and bulk actions

- **Selection is keyed by `_id`** (`getRowId` in `base-data-table .tsx`), not row position. Keyed by
  index, a server-paginated table carried "row 3" from page 1 onto page 2 — a different row showed
  ticked, and a bulk delete removed it. Ticks now survive paging and add up across pages;
  `onSelectionChange` and `onBulkDelete` receive every selected row, on any page (a `rowCache` ref
  keeps rows no longer on screen). Rows without `_id` fall back to the index key.
- **A filter change clears the selection** (`selectionResetKey`, which `DataTable` sets to its
  filters). Acting on rows the new filter hides is not something a merchant expects.
- **`bulkActions={(selection) => <buttons/>}`** turns on the selection bar
  (`ui/components/dataTable/selection-bar.tsx`): the count, "Select all N matching" (shown when the
  whole page is ticked and the filter matches more), Clear, and the page's buttons. `selection` is a
  `BulkSelection`: explicit `ids`, or `allMatching: true` with the current `filters` — then `ids` is
  empty and the action must send the filter to the server. `allMatching` drops on any tick, page turn
  or filter change. While it is on, the toolbar's "Delete N" hides (N would be the ticked page only).
- **`onFiltersChange`** reports the table's filters to the page (e.g. so a download matches the view).
- Reference use: the products page (`components/products/bulk/use-product-bulk-tools.tsx`).
- The card grid (`DataCard`) has no selection; bulk tools there are header actions only.

## Pagination Indexing (CRITICAL)

```
TanStack Table (0-based pageIndex) ⇄ DataTable state (1-based page) ⇄ Backend (1-based page)
```
- `paginationConfig.pageIndex = page - 1` (down-conversion at TanStack boundary).
- `onPaginationChange({ pageIndex }) → setPage(pageIndex + 1)` (up-conversion back).
- Backend MUST return `data: { items, total, page, limit, totalPages, hasNext, hasPrev }`. Missing `totalPages` → "Page 1 of undefined".

## Table Styling Cheatsheet

`variant`: `default | compact | relaxed | card` · `headless` · `borderless` · `rowSpacing: none|sm|md|lg` · `zebra` · `roundedRows` (needs `rowSpacing !== "none"`) · `stickyHeader` (max-h 600px scroll) · `rowBgColor: string | (row) => string`.

## Common Pitfalls

- **"Page 1 of undefined"** — backend missing `totalPages`.
- **Add button missing** — no `createMutation` and no `customActions` of `type: "create"` placement `"header"`. Either supply one or pass `toolbarAction`.
- **Edit form is empty** — missing `transformEditData`, or `defaultValues` not aligned with `formConfig`. Watch `useDynamicForm`'s required-string defaults.
- **Cache duplicates after pagination/filters** — you spread `page`, `limit`, `filters` as separate items in `queryKey`. Internal code packs them into a single object; if you build your own key elsewhere, do the same.
- **Sort header not clickable** — column has `enableSorting: false`, or `sortingConfig` is set but the column's `accessorKey`/`id` isn't in `sortOptions[].field`.
- **Custom Add button + auto Add button both show** — they don't; `type: "create"` + `placement: "header"` replaces the auto button. If you see two, you also passed `toolbarAction` plus a non-create header customAction.
- **Bulk delete deletes one-by-one** — `bulkDeleteMutation` not provided; `BaseDataTable` falls back to looping `onDelete`.
- **"Filters" button hidden under the header buttons** — the toolbar's `FilterBar` is `flex-1 basis-0`; it carries `sm:min-w-min` so a long row of header actions wraps instead of squeezing it to zero. Keep that class if you touch the toolbar.
- **Server sort field has no effect** — `enableSorting={true}` is required AND the column's identifier must match `SortOption.field` exactly (TanStack uses `accessorKey` or `id`).
- **Filter not respected by backend** — `FilterField.name` must match the query param the backend reads. Date-range arrives as JSON string, not as `from`/`to` keys.
- **`manageColumns` button does nothing** — also pass `module: "<key>"` AND remember the page is responsible for filtering visible columns via that module's settings (see [components/shared/column-settings-manager.tsx](components/shared/column-settings-manager.tsx)).
- **Deleting reload error** — your `deleteMutation` must accept the row's id (signature `mutateAsync(row)` per `useCrudModal`); check shape in [hooks/use-crud-handlers.ts](hooks/use-crud-handlers.ts).

## References

- [./references/quick-start.md](./references/quick-start.md) — minimal new-page example
- [./references/recipes.md](./references/recipes.md) — sorting, filters, customActions, file upload, custom cells, view mode, manageColumns
- [./references/props-reference.md](./references/props-reference.md) — full `DataTableProps`, `Operations`, `FilterConfig`, `CustomAction`, `SortingConfig`, styling props
- [ui/components/dataTable/datatable-doc.md](ui/components/dataTable/datatable-doc.md) — long-form architectural docs (data flow, indexing, backend contract)
