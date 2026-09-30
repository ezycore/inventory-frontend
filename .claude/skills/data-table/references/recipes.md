# DataTable Recipes

## File upload via `prepareSubmitData`

```ts
const prepareSubmitData = (data, isEdit, item) => {
  const fd = new FormData();
  fd.append("name", data.name);
  fd.append("status", data.status);

  if (isEdit) {
    if (!data.logo || data.logo.length === 0)       fd.append("remove_logo", "true");
    else if (data.logo[0] instanceof File)          fd.append("logo", data.logo[0]);
    // string URL → no-op (keep existing)
  } else if (data.logo?.[0] instanceof File) {
    fd.append("logo", data.logo[0]);
  }
  return fd; // id is auto-injected for edit
};
```

## Edit pre-fill (`transformEditData`)

```ts
transformEditData: (item) => ({
  ...item,
  logo: item.logo_url ? [item.logo_url] : [],   // url → file array
  categoryId: item.category?._id,                // populate id from nested object
}),
```

## Server-side sorting (only)

```tsx
sortingConfig={{
  sortOptions: [
    { field: "name",      label: "Name" },
    { field: "createdAt", label: "Created" },
    { field: "price",     label: "Price" },
  ],
  defaultSortBy: "createdAt",
  defaultSortOrder: "desc",
}}
enableSorting
```
Backend receives `?sort_by=name&sort_order=asc`. Columns NOT listed in `sortOptions` get `enableSorting: false` automatically.

## Replace default Edit with navigation

```ts
customActions={[
  { type: "edit", placement: "cell", onClick: (row) => router.push(`/brands/${row._id}/edit`) },
]}
```
Still uses the Edit icon and tooltip; only `onClick` is overridden.

## Replace default Add button with a link

```ts
customActions={[
  { type: "create", placement: "header", label: "Add Brand", icon: <Plus className="h-4 w-4" />, href: "/brands/new" },
]}
```
The auto-generated Add (from `createMutation`) is suppressed.

## Multiple header actions (Export, Import, Add)

```ts
customActions={[
  { type: "export", placement: "header", label: "Export", icon: <Download className="h-4 w-4" />, variant: "outline", onClick: exportCsv },
  { type: "import", placement: "header", label: "Import", icon: <Upload className="h-4 w-4" />,   variant: "outline", onClick: openImport },
  { type: "create", placement: "header", label: "Add",    icon: <Plus className="h-4 w-4" />,     href: "/brands/new" },
]}
```

## Cell action (custom, with conditional disable)

```ts
customActions={[
  {
    type: "duplicate",
    placement: "cell",
    icon: <Copy className="h-4 w-4" />,
    tooltip: "Duplicate",
    onClick: (row) => duplicate(row._id),
    disabled: (row) => row.status === "archived",
  },
]}
```

## Conditional row styling

```tsx
<DataTable
  rowClassName={(row) => row.status === "inactive" ? "bg-red-50 opacity-70" : ""}
  rowBgColor={(row) => row.is_featured ? "bg-yellow-50" : ""}
  zebra
/>
```

## Headless / borderless / compact / sticky / list-style rows

```tsx
<DataTable
  variant="compact"        // tighter padding
  headless                 // hide header row
  borderless               // remove the row/cell borders (there is no outer one)
  rowSpacing="md"          // separated rows (border-spacing-y-2)
  roundedRows              // round each row (needs rowSpacing != none)
  stickyHeader             // header sticks while scrolling (max-h 600px)
/>
```

## Column visibility — built-in vs persisted

| Mode | Props | Persisted? |
|------|-------|------------|
| Quick toggle dropdown | `enableColumnVisibility` | No (in-memory) |
| Per-user settings dialog | `manageColumns` + `module: "brand"` | Yes (via `column-settings-dialog`) |

Both can coexist.

## Custom date format / date-only

```tsx
cell: ({ row }) => <DateCell value={row.getValue("createdAt")} isShowDateOnly={false} dateFormat="MMM dd, yyyy" timeFormat="HH:mm" />
```

## View mode (read-only modal)

Just set `isViewAvailable: true` in `operations`. The eye icon opens the same DynamicForm with `viewMode={true}` (inputs render as text, no errors, "Close" button).

## Lock fields in edit (e.g. slug, email)

```ts
operations={{
  ...,
  disabledFieldsInEdit: ["slug", "email"],
}}
```

## Self-contained mode disabled (external data, client-side pagination)

```tsx
const { data } = useQuery({ queryKey: queryKeys.brands.all(), queryFn: () => brandService.getAll({ page: 1, limit: 1000 }) });
<DataTable
  data={data?.items ?? []}
  columns={columns}
  // no operations.getAllData → client-side pagination kicks in
/>
```

## Bulk delete

Add `bulkDeleteMutation` to `operations` AND `selectable` on the table. The toolbar shows "Delete N" once any row is selected. Without `bulkDeleteMutation`, BaseDataTable falls back to deleting selected rows one-by-one via `deleteMutation.mutateAsync`.

## Custom toolbar action (not using `customActions`)

```ts
toolbarAction={{ label: "Sync", icon: <RefreshCw className="h-4 w-4" />, onClick: sync, variant: "outline" }}
```
Overrides the auto Add button only when `createMutation` is absent.

## URL-driven filters

DataTable keeps page, page size, sort and filters in the URL through `useListUrlState`
(`hooks/use-list-url-state.ts`) — nothing to wire. Keys are the filter names plus `page`, `limit`,
`sort_by`, `sort_order`; defaults are left out, so an untouched list is its bare path.

A hand-rolled list uses the hook directly, declaring each filter by its default:

```ts
const list = useListUrlState({
  defaults: { limit: 20, filters: { status: "", courier: "all", q: "" } },
  limitOptions: LIST_PAGE_SIZES,
  prefix: "online_", // only when another list shares the screen
});
list.patchFilters({ status: "pending" }); // back to page 1
<ListSearchInput key={list.revision} defaultValue={list.filters.q} onSearch={(q) => list.patchFilters({ q })} />
```

Key anything that seeds itself once (a filter bar, a search box) on `list.revision`, so an outside URL
change — the sidebar link to the same list — resets what it shows.
