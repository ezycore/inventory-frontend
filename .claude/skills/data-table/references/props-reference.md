# DataTable Props Reference

## `<DataTable />` props (`DataTableProps<TData>`)

| Prop | Type | Required | Default | Notes |
|------|------|:-:|---|---|
| `columns` | `ColumnDef<TData>[]` | ✓ | — | TanStack column defs. `accessorKey` should match API field for sort/search. |
| `cardTitle` | `string \| (count) => string` |  | — | Heading above the table. Function receives backend `total`. |
| `operations` | `Operations<TData>` |  | — | Self-contained CRUD config (see below). |
| `data` | `TData[]` |  | — | External rows (omit `operations.getAllData` to use). |
| `filterConfig` | `FilterConfig` |  | — | Filter drawer/popover config. |
| `searchConfig` | `DataTableSearchConfig` |  | — | `globalSearch` or `searchableColumn` (CLIENT-SIDE only). |
| `sortingConfig` | `SortingConfig` |  | — | Enables server-side sort. Restricts which columns are sortable. |
| `defaultPageSize` | `number` |  | `10` | Initial page size. |
| `pageSizes` | `number[]` |  | `[10,20,50,100]` | Options in page-size selector. |
| `selectable` | `boolean` |  | `false` | Adds checkbox column + bulk delete UI. |
| `enableSorting` | `boolean` |  | `true` | Disables header sort UI when `false`. Required for server sort. |
| `enableColumnVisibility` | `boolean` |  | `false` | Quick toggle dropdown (not persisted). |
| `defaultColumnVisibility` | `VisibilityState` |  | `{}` | Initial hidden columns. |
| `enableRowHover` | `boolean` |  | `true` | Hover highlight on rows. |
| `rowClassName` | `string \| (row) => string` |  | — | Row class. |
| `rowBgColor` | `string \| (row) => string` |  | — | Row background. |
| `loading` | `boolean` |  | `false` | Force loading spinner. |
| `toolbarAction` | `{ label, icon?, onClick, variant? }` |  | — | Single primary toolbar button (overridden by `customActions[type=create]`). |
| `customActions` | `CustomAction[]` |  | — | Header + cell actions (see below). |
| `manageColumns` | `boolean` |  | `false` | Show settings dialog button (needs `module`). |
| `module` | `string` |  | — | Key for `column-settings-dialog`. |
| `onSelectionChange` | `(rows) => void` |  | — | Selection callback. |
| `variant` | `"default" \| "compact" \| "relaxed" \| "card"` |  | `"default"` | Cell padding/density. |
| `headless` | `boolean` |  | `false` | Hide header row. |
| `borderless` | `boolean` |  | `false` | Remove all borders. |
| `rowSpacing` | `"none" \| "sm" \| "md" \| "lg"` |  | `"none"` | `border-separate` spacing between rows. |
| `zebra` | `boolean` |  | `false` | Alternating row colors. |
| `roundedRows` | `boolean` |  | `false` | Rounded row corners (needs `rowSpacing`). |
| `stickyHeader` | `boolean` |  | `false` | Sticky header within `max-h-[600px] overflow-y-auto` wrapper. |

## `Operations<TData>`

| Field | Type | Notes |
|-------|------|-------|
| `getAllData` | `(params) => Promise<ApiResponse<PaginatedResponse<T>>>` | Server-side fetcher. Receives `{ page, limit, ...filters, sort_by?, sort_order? }`. **page is 1-based**. |
| `queryKey` | `any[]` | Base key. Final key = `[...queryKey, { page, limit, ...filters, sort_by, sort_order }]`. |
| `createMutation` / `updateMutation` / `deleteMutation` / `bulkDeleteMutation` | `UseMutationResult` | Each enables its UI. Each must invalidate `queryKey` in its own `onSuccess`. |
| `formConfig` | `DynamicFormConfig` | Driven through internal `<DynamicForm>`. |
| `defaultValues` | `Partial<TData>` | Initial values for create. |
| `entityName` | `string` | Used in: `Add {n}`, `Edit {n}`, `Delete {n}`, `{n} Details`, default tooltips. |
| `isViewAvailable` | `boolean` | Show eye icon → opens form in `viewMode`. |
| `editTooltip` / `deleteTooltip` / `viewTooltip` | `string` | Override default tooltips. |
| `transformEditData` | `(item) => formValues` | Reshape API row → form values (URL → file array, populate ids from objects). |
| `prepareSubmitData` | `(data, isEdit, item) => any` | Reshape form → backend payload. Return `FormData` for uploads. |
| `openInside` | `"modal" \| "drawer"` | Form container type. |
| `disabledFieldsInEdit` | `string[]` | Fields locked when editing. |

## `FilterConfig`

```ts
{
  fields?: FilterField[];
  columns?: 1 | 2 | 3 | 4;        // grid columns
  applyOnChange?: boolean;        // skip Apply button
  showResetButton?: boolean;
  showApplyButton?: boolean;
  viewMode?: "drawer" | "popover";
  initialValues?: Record<string, any>;  // auto-populated from URL
  // onApply / onReset are auto-injected by DataTable
}
```

`FilterField`: `{ name, label, type: "text"|"select"|"date"|"date-range"|"checkbox"|"number"|"number-range", placeholder?, options?, columnSpan?, defaultValue? }`. Date-range value is sent as JSON string.

## `SortingConfig`

```ts
{
  sortOptions: { field: string; label: string }[];
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
}
```

Behavior: enables `manualSorting`. Columns whose `accessorKey`/`id` ∉ `sortOptions[].field` get `enableSorting: false`. Click resets to page 1.

## `CustomAction`

```ts
{
  type: "edit" | "view" | "delete" | "create" | string;
  placement: "header" | "cell";
  href?: string | (row?) => string;
  onClick?: (row?) => void;
  icon?: ReactNode;
  label?: string;
  tooltip?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  render?: (row?) => ReactNode;        // overrides everything
  disabled?: boolean | (row) => boolean;
}
```

Rules:
- `type: "create"` + `placement: "header"` replaces the auto Add button.
- `type: "edit" | "view" | "delete"` + `placement: "cell"` overrides the matching default action's `onClick` (icon stays).
- Other `type` + `placement: "cell"` adds an extra icon button after the defaults.
- `href` wraps the button in a Next `<Link>`.

## `DataTableSearchConfig`

```ts
{
  globalSearch?: boolean;       // searches all columns (TanStack global filter)
  searchableColumn?: keyof T;   // searches one column
  placeholder?: string;
}
```
**Client-side only.** For server-side search, use a text `FilterField`.

## Backend response (required)

```ts
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,   // REQUIRED for pagination
    hasNext: boolean,
    hasPrev: boolean,
  }
}
```

## Cell components

```ts
AvatarCell({ imageUrl, name, fallbackIcon?, isActive?, activeColor?, inactiveColor? })
DateCell({ value, isShowDateOnly?, className?, dateFormat?, timeFormat? })
```
`DateCell` reads timezone from `useAuthStore`.

## Internal hooks (rarely needed directly)

- `usePaginationState(pagination)` — adapts external pagination → TanStack 0-based state.
- `useDeleteDialog(onDelete)` — handles confirm dialog state.
- `useEnhancedColumns({ columns, selectable, actions, onView, onEdit, openDeleteDialog, customActions, serverSortableFields })` — injects checkbox column + actions column.
- `useCrudModal({ form, defaultValues, transformEditData, onDeleteFn, onBulkDeleteFn, entityName })` — modal state + handlers.
