---
title: DataTable Component Documentation
version: 1.0.0
entry: ui/components/dataTable/index.tsx
defaultExport: DataTable
lastUpdated: 2025-12-14
status: stable
---

# DataTable Component - Complete Reference

## 1. Overview

The **DataTable** is a self-contained table component that integrates data fetching, filtering, pagination, sorting, and CRUD operations. It wraps TanStack Table with built-in UI components and provides a unified API for common table patterns.

**Key Features:**
- Self-contained data fetching with TanStack Query integration
- Built-in filter system with date/date-range support
- Pagination with server-side or client-side modes
- CRUD operations with modal/drawer forms
- Bulk selection and deletion
- Sorting, column visibility, and search
- Reusable cell components (Avatar, Date)
- Responsive design with mobile/desktop views

---

## 2. Quick Start

### Minimal Usage (Self-contained mode)

```tsx
import { DataTable } from "@/ui/components/dataTable";
import { brandsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/queries";
import type { Brand } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Brand>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
];

export default function BrandsPage() {
  return (
    <DataTable
      cardTitle="Brands"
      columns={columns}
      operations={{
        getAllData: brandsApi.getAll,
        queryKey: queryKeys.brands.all(),
        entityName: "Brand",
      }}
    />
  );
}
```

### With Filters and CRUD

```tsx
const filterConfig: FilterConfig = {
  fields: [
    { name: "status", label: "Status", type: "select", options: [...] },
    { name: "createdAt", label: "Created", type: "date-range" },
  ],
  viewMode: 'popover',
  columns: 2,
};

const formConfig: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", label: "Name", required: true },
    { name: "logo_url", type: "file-upload", label: "Logo", accept: "image/*" },
  ],
};

<DataTable
  cardTitle={(count) => `Brands (${count})`}
  columns={columns}
  filterConfig={filterConfig}
  operations={{
    getAllData: brandsApi.getAll,
    createMutation: useCreateBrand(),
    updateMutation: useUpdateBrand(),
    deleteMutation: useDeleteBrand(),
    queryKey: queryKeys.brands.all(),
    formConfig: formConfig,
    entityName: "Brand",
    prepareSubmitData: (data, isEdit, item) => prepareFormData(data, isEdit, item),
  }}
  selectable={true}
  enableSorting={true}
/>
```

### With Search (Global or Column-Specific)

```tsx
// Global search (searches all columns)
const searchConfig: DataTableSearchConfig = {
  globalSearch: true,
  placeholder: "Search brands by name, description, or status...",
};

<DataTable
  cardTitle="Brands"
  columns={columns}
  searchConfig={searchConfig}
  operations={{
    getAllData: brandsApi.getAll,
    queryKey: queryKeys.brands.all(),
  }}
/>

// Column-specific search (searches only 'name' column)
const searchConfig: DataTableSearchConfig<Brand> = {
  searchableColumn: "name",
  placeholder: "Search by name...",
};

<DataTable
  cardTitle="Brands"
  columns={columns}
  searchConfig={searchConfig}
  operations={{
    getAllData: brandsApi.getAll,
    queryKey: queryKeys.brands.all(),
  }}
/>
```

---

## 3. Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cardTitle` | `string \| ((length: number) => string)` | Yes | - | Table card title. Can be function to display count |
| `columns` | `ColumnDef<TData, TValue>[]` | Yes | - | TanStack Table column definitions |
| `operations` | `Operations<TData>` | Yes* | - | CRUD config and data fetching (see Operations section) |
| `filterConfig` | `FilterConfig` | No | `undefined` | Filter fields configuration |
| `defaultPageSize` | `number` | No | `10` | Initial page size |
| `pageSizes` | `number[]` | No | `[5,10,20,30,50,100]` | Available page size options |
| `selectable` | `boolean` | No | `false` | Enable row selection checkboxes |
| `searchConfig` | `DataTableSearchConfig` | No | `undefined` | Search configuration (global or column-specific) |
| `enableSorting` | `boolean` | No | `true` | Enable column sorting |
| `enableColumnVisibility` | `boolean` | No | `false` | Show column visibility dropdown |
| `defaultColumnVisibility` | `VisibilityState` | No | `{}` | Initial column visibility state |
| `enableRowHover` | `boolean` | No | `true` | Enable hover effect on rows |
| `rowClassName` | `string \| ((row: TData) => string)` | No | `undefined` | Custom row CSS classes |
| `toolbarAction` | `ToolbarAction` | No | `undefined` | Custom toolbar button (overrides default "Add" button) |
| `customActions` | `CustomAction[]` | No | `[]` | Custom action buttons in toolbar or cells |
| `data` | `TData[]` | No | `undefined` | External data (for non-self-contained mode) |

### Operations Interface

```typescript
interface Operations<TData> {
  // Data fetching (required for self-contained mode)
  getAllData?: (params: { page: number; limit: number; filters: any }) => Promise<any>;
  queryKey?: any[];
  
  // CRUD mutations
  createMutation?: UseMutationResult<any, Error, any, unknown>;
  updateMutation?: UseMutationResult<any, Error, any, unknown>;
  deleteMutation?: UseMutationResult<any, Error, any, unknown>;
  
  // Form configuration
  formConfig?: DynamicFormConfig;
  defaultValues?: Partial<TData>;
  transformEditData?: (item: TData) => any;
  prepareSubmitData?: (data: any, isEdit: boolean, originalItem?: TData) => any;
  openInside?: "modal" | "drawer";
  
  // Entity metadata
  entityName?: string; // Used in labels: "Add {entityName}", "Delete {entityName}"
  isViewAvailable?: boolean; // Show view button
  editTooltip?: string;
  deleteTooltip?: string;
  viewTooltip?: string;
}
```

### SearchConfig Interface

```typescript
interface DataTableSearchConfig<TData = any> {
  /** Enable global search across all columns (client-side only) */
  globalSearch?: boolean;
  
  /** Specific column to search (column-specific search) */
  searchableColumn?: keyof TData;
  
  /** Placeholder text for search input */
  placeholder?: string;
}
```

**Note:** Search is **client-side only** (uses TanStack Table filtering). For server-side search, use `filterConfig` with a text field.

### FilterConfig Interface

```typescript
interface FilterConfig {
  fields?: FilterField[];
  columns?: 1 | 2 | 3 | 4; // Grid columns for filter layout
  viewMode?: 'drawer' | 'popover'; // Sheet or popover display
  applyOnChange?: boolean; // Auto-apply on field change
  showResetButton?: boolean;
  showApplyButton?: boolean;
  onApply?: (filters: Record<string, any>) => void; // Auto-added by DataTable
  onReset?: () => void; // Auto-added by DataTable
}

interface FilterField {
  name: string; // Filter parameter name
  label: string;
  type: "text" | "select" | "date" | "date-range" | "checkbox" | "number" | "number-range";
  placeholder?: string;
  options?: { label: string; value: any }[]; // For select type
  columnSpan?: number; // Grid span (1-4)
  defaultValue?: any;
}
```

---

## 4. API Contract

### GET Request Parameters

When using `operations.getAllData`, DataTable sends these query params:

```
GET /api/brands?page=1&limit=10&status=active&createdAt={"from":"2024-01-01","to":"2024-12-31"}
```

**Standard Parameters:**
- `page` (number): 1-based page index
- `limit` (number): Items per page

**Dynamic Filter Parameters:**
- Any filter field name from `filterConfig.fields`
- Simple values sent as strings: `?status=active`
- Objects serialized as JSON: `?createdAt={"from":"2024-01-01","to":"2024-12-31"}`

### Backend Filter Parsing

```typescript
// routes/brands.ts (backend example)
const filters: any = {};

// Text filter (name search)
if (req.query.brand) {
  filters.name = { $regex: req.query.brand, $options: 'i' };
}

// Select filter (exact match)
if (req.query.status) {
  filters.status = req.query.status;
}

// Date filter (single date or date-range)
if (req.query.createdAt) {
  try {
    const dateValue = JSON.parse(req.query.createdAt as string);
    if (dateValue.from && dateValue.to) {
      filters.createdAt = {
        $gte: new Date(dateValue.from),
        $lte: new Date(dateValue.to),
      };
    }
  } catch {
    // Fallback: parse as ISO string
    filters.createdAt = { $gte: new Date(req.query.createdAt as string) };
  }
}
```

### Expected Response Format

**Backend must return:**
```typescript
{
  success: true,
  data: {
    items: TData[],        // Array of data items
    total: number,         // Total count of items
    page: number,          // Current page (1-based)
    limit: number,         // Items per page
    totalPages: number,    // Total page count
    hasNext: boolean,      // Has next page
    hasPrev: boolean,      // Has previous page
  }
}
```

**Type Definition:**
```typescript
ApiResponse<PaginatedResponse<TData>>
```

**CRITICAL:** Backend MUST return `data.totalPages` for pagination UI to work correctly.

### Pagination Modes

**Server-Side Pagination (Default):**
- DataTable sends `page` and `limit` to API
- Backend returns paginated results + `totalPages`
- Use for large datasets (1,000+ items)

```tsx
<DataTable
  operations={{
    getAllData: brandsApi.getAll, // API handles pagination
    queryKey: queryKeys.brands.all(),
  }}
/>
```

**Client-Side Pagination:**
- DataTable fetches all data once
- Pagination happens in browser (TanStack Table)
- Use for small datasets (<500 items)
- Pass `data` prop directly:

```tsx
const { data } = useQuery({
  queryKey: queryKeys.brands.all(),
  queryFn: () => brandsApi.getAll({ page: 1, limit: 1000 }),
});

<DataTable
  data={data?.items || []}
  columns={columns}
  // No operations.getAllData (external data mode)
/>
```

---

## 5. Filters & Date Handling

### Filter Serialization

DataTable uses `lib/api-client.ts` to serialize filters:

```typescript
// lib/api-client.ts
const params = new URLSearchParams();
Object.entries(filters).forEach(([key, value]) => {
  if (typeof value === 'object' && value !== null) {
    params.append(key, JSON.stringify(value)); // Serialize objects
  } else {
    params.append(key, String(value)); // Simple values as strings
  }
});
```

### Date-Range Filter Example

```typescript
// Filter config
{
  name: "createdAt",
  label: "Created Date",
  type: "date-range",
  placeholder: "Select range",
}

// User selects: Jan 1, 2024 - Dec 31, 2024
// Sent to API: ?createdAt={"from":"2024-01-01T00:00:00.000Z","to":"2024-12-31T23:59:59.999Z"}

// Backend parsing:
const createdAt = JSON.parse(req.query.createdAt);
filters.createdAt = {
  $gte: new Date(createdAt.from), // 2024-01-01T00:00:00.000Z
  $lte: new Date(createdAt.to),   // 2024-12-31T23:59:59.999Z
};
```

### Single Date Filter Example

```typescript
// Filter config
{
  name: "updatedAt",
  label: "Updated Date",
  type: "date",
}

// User selects: Jan 15, 2024
// Sent to API: ?updatedAt=2024-01-15T00:00:00.000Z

// Backend parsing:
filters.updatedAt = { $gte: new Date(req.query.updatedAt) };
```

### Filter Reset Behavior

When user clicks "Reset":
1. `filterConfig.onReset()` callback fires
2. Internal `filters` state resets to `{}`
3. `page` resets to `0`
4. TanStack Query refetches with empty filters

---

## 6. CRUD Workflow

### Create Flow

1. User clicks "Add {entityName}" button (generated from `operations.entityName`)
2. `useCrudModal.handleAdd()` opens modal with `operations.defaultValues`
3. User fills form fields from `operations.formConfig`
4. On submit: `operations.prepareSubmitData(data, false, null)` transforms data
5. `operations.createMutation.mutate(preparedData)` sends to backend
6. On success: Modal closes, TanStack Query invalidates `operations.queryKey`

### Edit Flow

1. User clicks Edit icon in actions column
2. `useCrudModal.handleEdit(item)` opens modal
3. `operations.transformEditData(item)` transforms API data for form (e.g., convert string URL to File array)
4. User edits form
5. On submit: `operations.prepareSubmitData(data, true, originalItem)` transforms data
6. `operations.updateMutation.mutate(preparedData)` sends to backend
7. On success: Modal closes, query invalidates

### Delete Flow

1. User clicks Delete icon in actions column
2. `EasyAlertDialog` confirmation dialog opens
3. User confirms
4. `operations.deleteMutation.mutate({ id: item._id })` sends to backend
5. On success: Dialog closes, query invalidates

### prepareSubmitData Example (FormData for file uploads)

```typescript
const prepareSubmitData = (data: Brand, isEdit: boolean, item?: Brand) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("status", data.status);

  if (isEdit && item) {
    formData.append("id", item._id);

    // Handle logo changes
    if (!data.logo_url || data.logo_url.length === 0) {
      formData.append("remove_logo", "true"); // User removed logo
    } else if (data.logo_url[0] instanceof File) {
      formData.append("logo", data.logo_url[0]); // User uploaded new file
    }
    // If data.logo_url[0] is string (URL), do nothing (keep existing)
  } else {
    // Create mode: Upload new file
    if (data.logo_url?.[0] instanceof File) {
      formData.append("logo", data.logo_url[0]);
    }
  }

  return formData;
};
```

---

## 7. Subcomponents & Files

| File | Path | Responsibility |
|------|------|----------------|
| **DataTable** | `index.tsx` | Main export. Integrates useQuery, filter state, pagination state, useCrudModal. Wraps BaseDataTable. |
| **BaseDataTable** | `base-data-table .tsx` | Core table logic. Manages TanStack Table instance, sorting, column visibility, row selection. |
| **DataTableToolbar** | `toolbar.tsx` | Search input, filter trigger, bulk delete, column visibility dropdown, custom action buttons. |
| **DataTableBody** | `table-body.tsx` | Table header/body rendering with sorting icons, loading spinner, empty state. |
| **DataTablePagination** | `pagination.tsx` | Page size selector, page info, navigation buttons (first, prev, next, last). |
| **useEnhancedColumns** | `columns.tsx` | Hook to inject selection column and actions column (edit/view/delete/custom). |
| **usePaginationState** | `hooks.ts` | Manages TanStack Table pagination state (pageIndex, pageSize). |
| **useDeleteDialog** | `hooks.ts` | Manages delete confirmation dialog state. |
| **useCrudModal** | `hooks/use-crud-handlers.ts` | Manages CRUD modal state (isModalOpen, editingItem, isViewMode) and handlers. |
| **AvatarCell** | `cells/avatar-cell.tsx` | Reusable cell with image/fallback icon and status color. |
| **DateCell** | `cells/date-cell.tsx` | Reusable cell with formatted date (uses timezone and format from settings store). |
| **EasyAlertDialog** | `../easy-alert-dialog.tsx` | Reusable confirmation dialog (delete, bulk delete). |
| **GlobalFilter** | `../filters/global-filter.tsx` | Filter sheet/popover with dynamic field rendering (text, select, date, date-range). |
| **DynamicForm** | `../form/index.tsx` | Form modal/drawer with field validation, file uploads, conditional fields. |

---

## 8. Hooks Used

### Internal Hooks (ui/components/dataTable/hooks.ts)

**usePaginationState**
- **Purpose:** Manages TanStack Table pagination state (pageIndex, pageSize)
- **Input:** `pagination?: DataTablePagination` (optional server-side config)
- **Output:** `{ paginationState, handlePaginationChange }`
- **Behavior:** Uses 0-based `pageIndex` for TanStack Table. The parent `DataTable` component handles conversion between 0-based (TanStack) and 1-based (backend).
- **Note:** This hook returns `pageIndex` directly from props (already converted by DataTable from 1-based `page` to 0-based `pageIndex`).

**useDeleteDialog**
- **Purpose:** Manages delete confirmation dialog state
- **Input:** `onDelete?: (row: TData) => void | Promise<void>`
- **Output:** `{ deleteDialogOpen, setDeleteDialogOpen, rowToDelete, isDeleting, handleDeleteConfirm, openDeleteDialog }`
- **Behavior:** Opens dialog, executes async delete, closes on success.

### External Hooks

**useCrudModal** (hooks/use-crud-handlers.ts)
- **Purpose:** Manages CRUD modal state (create/edit/view modes)
- **Input:** `{ form, defaultValues, transformEditData, onDeleteFn, entityName }`
- **Output:** `{ isModalOpen, editingItem, isViewMode, handleAdd, handleEdit, handleView, handleDelete, handleCloseModal }`
- **Behavior:** Handles form reset, modal open/close, edit data transformation.

**useQuery** (TanStack Query)
- **Purpose:** Fetches data with caching and invalidation
- **Usage:** `useQuery({ queryKey: [...queryKey, { page, limit, ...filters }], queryFn: () => getAllData({ page, limit, ...filters }) })`
- **Behavior:** Refetches on queryKey change (pagination, filters). Caches results.

**useMutation** (TanStack Query)
- **Purpose:** Executes create/update/delete mutations
- **Usage:** `useMutation({ mutationFn: createApi, onSuccess: () => queryClient.invalidateQueries(queryKey) })`
- **Behavior:** Invalidates query cache on success to refetch data.

---

## 9. Error Handling

### Query Errors (Data Fetching)

DataTable uses `ErrorBoundaryFallback` to catch and display useQuery errors:

```tsx
// Inside index.tsx
if (error) {
  return <ErrorBoundaryFallback error={error} onRetry={refetch} />;
}
```

**ErrorBoundaryFallback displays:**
- Error message from API
- "Retry" button to refetch data
- Fallback UI when network fails

**Backend error response format:**
```typescript
{
  success: false,
  message: "Failed to fetch brands",
  error: "Database connection timeout",
}
```

### Mutation Errors (CRUD Operations)

Mutation errors are handled by `DynamicForm` component:

```tsx
// Automatic toast notifications
onError: (error) => {
  toast.error(`Failed to ${isEdit ? 'update' : 'create'} ${entityName}`);
}
```

**Custom error handling:**
```tsx
const createMutation = useMutation({
  mutationFn: brandsApi.create,
  onError: (error: any) => {
    if (error.response?.status === 409) {
      toast.error("Brand name already exists");
    } else {
      toast.error("Failed to create brand");
    }
  },
});
```

### Empty State

When no data is available:

```tsx
if (!data || data.length === 0) {
  return <div className="p-6 text-center text-gray-500">No data available.</div>;
}
```

### Loading States

```tsx
// Initial load
{isLoading && <TableCell colSpan={columns.length}>Loading...</TableCell>}

// Mutation in progress
{isDeleting && <Button disabled>Deleting...</Button>}
```

---

## 10. Behavior Details

### ⚠️ CRITICAL: QueryKey & Pagination Indexing

**QueryKey Format:**
```typescript
// ✅ CORRECT - Object format (single object with all params)
queryKey: [...queryKey, { page, limit, ...filters }]

// ❌ WRONG - Separate arguments (causes cache duplication)
queryKey: [...queryKey, page, limit, filters]
```

**Page Numbering - Conversion Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│  TanStack Table (0-based) ←→ DataTable ←→ Backend (1-based) │
└─────────────────────────────────────────────────────────────┘

  TanStack Table          DataTable State        Backend API
  pageIndex: 0     →      page: 1         →      ?page=1
  pageIndex: 1     →      page: 2         →      ?page=2
  pageIndex: 2     →      page: 3         →      ?page=3
```

**Key Points:**
1. **TanStack Table:** Uses 0-based `pageIndex` (first page = 0)
2. **DataTable Internal State:** Uses 1-based `page` (first page = 1)
3. **Backend API:** Expects 1-based `page` (first page = 1)

**Conversion Logic:**
```typescript
// DataTable → TanStack Table (0-based)
pageIndex: page - 1

// TanStack Table → DataTable (1-based)
setPage(pageIndex + 1)

// DataTable → Backend (1-based, no conversion)
getAllData({ page, limit, ...filters })
```

**Complete Flow Example:**
```typescript
// User clicks "Next" to go to page 2

// 1. TanStack Table receives: pageIndex = 1 (0-based)
table.nextPage() // pageIndex changes from 0 to 1

// 2. onPaginationChange converts to 1-based
setPage(pageIndex + 1) // page = 1 + 1 = 2

// 3. useQuery refetches with 1-based page
queryKey: ['brands', { page: 2, limit: 10 }]
queryFn: () => getAllData({ page: 2, limit: 10 })

// 4. Backend receives 1-based page
GET /api/brands?page=2&limit=10

// 5. DataTable converts back to 0-based for TanStack Table
paginationConfig: {
  pageIndex: 2 - 1, // = 1 (TanStack Table expects 0-based)
  pageSize: 10,
  onPaginationChange: ({ pageIndex, pageSize }) => {
    setPage(pageIndex + 1); // Convert back to 1-based
  }
}
```

### Pagination Reset on Filter Change

When user applies filters:
1. `filterConfig.onApply(filters)` fires
2. Internal `page` state resets to `1` (first page, 1-based indexing)
3. TanStack Query refetches with updated queryKey including new filters

**Code:**
```typescript
const mergedFilterConfig = useMemo(() => ({
  ...filterConfig,
  onApply: (appliedFilters: any) => {
    setFilters(appliedFilters);
    setPage(1); // Reset to page 1 (1-based indexing)
  },
  onReset: () => {
    setFilters({});
    setPage(1); // Reset to page 1
  },
}), [filterConfig]);
```

### QueryKey Strategy

**Structure:**
```typescript
[...operations.queryKey, { page, limit, ...filters }]
```

**Example:**
```typescript
// queryKey: ['brands']
// page: 1, limit: 10, filters: { status: 'active' }
// Final queryKey: ['brands', { page: 1, limit: 10, status: 'active' }]
```

**IMPORTANT:** QueryKey uses an object to combine pagination and filters, NOT separate arguments.

**Why:**
- TanStack Query caches by queryKey
- Changing page/limit/filters triggers new fetch
- Filters object must be serializable (JSON.stringify-able)

### Data Extraction from API Response

DataTable expects response shape:
```typescript
{
    items: TData[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
```

**Code:**
```typescript
const { data: queryData } = useQuery<ApiResponse<PaginatedResponse<TData>>>({
  queryKey: [...queryKey, { page, limit, ...(filters || {}) }],
  queryFn: () => getAllData({ page, limit, ...filters }),
});

const data = queryData?.data?.items || [];
```

**Note:** Response is wrapped in `ApiResponse`, so access items via `queryData.data.items`.

### Caching Behavior

- TanStack Query caches all responses by queryKey
- Navigating between pages uses cached data (instant)
- Mutations invalidate cache: `queryClient.invalidateQueries(queryKey)`
- Changing filters creates new cache entry

---

## 11. Accessibility

### Keyboard Navigation

- **Tab:** Focus toolbar search → filter trigger → column visibility → action button → table rows
- **Enter:** Activate focused button (search clear, filter apply, etc.)
- **Space:** Toggle checkboxes in selection column
- **Arrow Keys:** Navigate table cells (native browser behavior)

### Screen Reader Support

- **TableHead:** Sortable columns announce "Click to sort"
- **Checkbox:** Selection checkboxes have implicit labels
- **Buttons:** All icon buttons have tooltips (hovered/focused)
- **AlertDialog:** Confirmation dialogs have aria-labelledby and aria-describedby

### Focus Management

- **Filter Sheet:** Focus traps inside sheet when open
- **Modal/Drawer:** DynamicForm traps focus
- **AlertDialog:** Focus moves to "Cancel" button on open

### Popover vs Sheet

- **Popover:** Desktop-friendly, anchor to trigger, `Esc` to close
- **Sheet:** Mobile-optimized, full-width on small screens, slide-in animation
- **stopPropagation:** Clear buttons in date pickers prevent popover close

---

## 12. Testing Checklist

### Unit Tests

- [ ] `usePaginationState` handles server-side and client-side pagination
- [ ] `useDeleteDialog` opens/closes correctly and calls `onDelete`
- [ ] `useEnhancedColumns` injects selection and actions columns conditionally
- [ ] Filter serialization converts objects to JSON strings
- [ ] Date-range picker syncs with external `value` prop on reset

### Integration Tests

- [ ] DataTable fetches data on mount with initial `queryKey`
- [ ] Pagination buttons refetch with new `page` in queryKey
- [ ] Page size change resets `page` to 0 and refetches
- [ ] Filter apply resets `page` to 0 and includes filters in queryKey
- [ ] Filter reset clears filters and refetches
- [ ] Sort column refetches with sort in queryKey (if server-side)
- [ ] Bulk delete confirmation deletes selected rows
- [ ] Create mutation opens modal, submits, closes, and refetches
- [ ] Edit mutation pre-fills form, submits changes, refetches
- [ ] Delete single row opens dialog, confirms, refetches

### UI/Visual Tests

- [ ] Loading spinner shows while `isLoading === true`
- [ ] Empty state shows "No data available" when `data.length === 0`
- [ ] Row hover effect applies when `enableRowHover === true`
- [ ] Custom `rowClassName` function applies conditionally (e.g., red background for inactive)
- [ ] Column visibility dropdown hides/shows columns
- [ ] Mobile: Filter opens as sheet, buttons are full-width
- [ ] Desktop: Filter opens as popover (if `viewMode: 'popover'`), buttons are auto-width

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Space, Arrows)
- [ ] Screen reader announces sortable columns, checkboxes, buttons
- [ ] Focus trap works in sheet/modal/alert dialog
- [ ] All icon buttons have tooltips
- [ ] Color contrast meets WCAG AA (status colors, buttons)

---

## 13. Common Pitfalls & Solutions

### 1. Filter Not Working

**Problem:** Filters applied but data doesn't change.

**Solution:** Ensure backend parses filters from query params:
```typescript
// Backend must read req.query.status, req.query.createdAt, etc.
const filters: any = {};
if (req.query.status) filters.status = req.query.status;
```

### 2. Pagination Showing Wrong Total Pages

**Problem:** Pagination says "Page 1 of undefined".

**Solution:** Backend must return `totalPages` in response:
```typescript
return {
  success: true,
  data: {
    items: [...],
    total: totalItems,
    page,
    limit,
    totalPages: Math.ceil(totalItems / limit), // REQUIRED
    hasNext: page < Math.ceil(totalItems / limit),
    hasPrev: page > 1,
  },
};
```

### 3. File Upload Not Working

**Problem:** Logo doesn't upload in create/edit.

**Solution:** Use `prepareSubmitData` to create FormData:
```typescript
const prepareSubmitData = (data, isEdit, item) => {
  const formData = new FormData();
  if (data.logo?.[0] instanceof File) {
    formData.append("logo", data.logo[0]); // Append File object
  }
  return formData; // Return FormData, not JSON
};
```

### 4. Date Filter Sends Invalid Format

**Problem:** Backend receives `[object Object]` for date-range.

**Solution:** Already handled by `lib/api-client.ts` (JSON.stringify). Ensure backend uses:
```typescript
const createdAt = JSON.parse(req.query.createdAt); // Parse JSON string
```

### 5. Edit Form Doesn't Pre-fill

**Problem:** Form opens empty in edit mode.

**Solution:** Use `transformEditData` to convert API data to form format:
```typescript
transformEditData: (item) => ({
  ...item,
  logo: item.logo_url ? [item.logo_url] : [], // String URL → Array
})
```

### 6. QueryKey Not Invalidating

**Problem:** Table doesn't refetch after create/update.

**Solution:** Ensure mutation invalidates correct queryKey:
```typescript
useMutation({
  mutationFn: brandsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() });
  },
});
```

### 7. Pagination Off By One Error

**Problem:** Backend returns "Page not found" or shows wrong page.

**Cause:** Mixing 0-based and 1-based indexing.

**Solution:** DataTable handles conversion automatically:
```typescript
// ✅ CORRECT - DataTable handles conversion
<DataTable
  operations={{
    getAllData: brandsApi.getAll, // Receives page=1 for first page
    queryKey: queryKeys.brands.all(),
  }}
/>

// ❌ WRONG - Manual conversion causes double conversion
const getAllData = (params) => {
  return api.get('/brands', {
    params: { ...params, page: params.page - 1 } // Don't do this!
  });
};
```

**Backend Verification:**
```typescript
// Backend should expect 1-based page
const page = parseInt(req.query.page as string) || 1; // Default to 1
const skip = (page - 1) * limit; // Convert to 0-based offset
```

---

## 14. Common Patterns & Examples

### Pattern 1: Simple Read-Only Table

```tsx
<DataTable
  cardTitle="Products"
  columns={[
    { accessorKey: "name", header: "Name" },
    { accessorKey: "price", header: "Price" },
  ]}
  operations={{
    getAllData: productsApi.getAll,
    queryKey: queryKeys.products.all(),
  }}
/>
```

### Pattern 2: Table with Filters (No CRUD)

```tsx
const filterConfig: FilterConfig = {
  fields: [
    { name: "search", label: "Search", type: "text" },
    { name: "status", label: "Status", type: "select", options: [...] },
  ],
  viewMode: 'popover',
};

<DataTable
  columns={columns}
  filterConfig={filterConfig}
  operations={{
    getAllData: api.getAll,
    queryKey: queryKeys.all(),
  }}
/>
```

### Pattern 3: Full CRUD with File Upload

```tsx
const formConfig: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", label: "Name", required: true },
    { name: "logo", type: "file-upload", accept: "image/*", maxFiles: 1 },
  ],
};

const prepareSubmitData = (data, isEdit, item) => {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.logo?.[0] instanceof File) {
    formData.append("logo", data.logo[0]);
  }
  if (isEdit) formData.append("id", item._id);
  return formData;
};

<DataTable
  columns={columns}
  operations={{
    getAllData: api.getAll,
    createMutation: useCreate(),
    updateMutation: useUpdate(),
    deleteMutation: useDelete(),
    queryKey: queryKeys.all(),
    formConfig,
    prepareSubmitData,
    transformEditData: (item) => ({
      ...item,
      logo: item.logo_url ? [item.logo_url] : [], // Convert URL to File array
    }),
    entityName: "Brand",
  }}
/>
```

### Pattern 4: Conditional Row Styling

```tsx
<DataTable
  columns={columns}
  rowClassName={(row: Brand) =>
    row.status === "inactive" ? "bg-red-50 opacity-70" : ""
  }
  operations={{
    getAllData: api.getAll,
    queryKey: queryKeys.all(),
  }}
/>
```

### Pattern 5: Bulk Selection with Custom Action

```tsx
const [selectedRows, setSelectedRows] = useState<Brand[]>([]);

<DataTable
  columns={columns}
  selectable={true}
  operations={{
    getAllData: api.getAll,
    deleteMutation: useDelete(), // Enables bulk delete
    queryKey: queryKeys.all(),
  }}
/>
```

### Pattern 6: Custom Toolbar Action

```tsx
<DataTable
  columns={columns}
  toolbarAction={{
    label: "Import CSV",
    icon: <Upload className="h-4 w-4" />,
    onClick: () => openImportDialog(),
    variant: "secondary",
  }}
  operations={{
    getAllData: api.getAll,
    queryKey: queryKeys.all(),
  }}
/>
```

### Pattern 7: Date-Range Filter with Backend Parsing

**Frontend:**
```tsx
const filterConfig: FilterConfig = {
  fields: [
    {
      name: "createdAt",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select range",
    },
  ],
};
```

**Backend (Express + MongoDB):**
```typescript
const filters: any = {};
if (req.query.createdAt) {
  try {
    const dateValue = JSON.parse(req.query.createdAt as string);
    if (dateValue.from && dateValue.to) {
      filters.createdAt = {
        $gte: new Date(dateValue.from),
        $lte: new Date(dateValue.to),
      };
    }
  } catch {
    filters.createdAt = { $gte: new Date(req.query.createdAt as string) };
  }
}

const items = await Brand.find(filters)
  .skip((page - 1) * limit)
  .limit(limit);

const total = await Brand.countDocuments(filters);

return {
  success: true,
  data: {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  },
};
```

---

## 15. Advanced Customization

### Custom Cell Components

```tsx
import { AvatarCell, DateCell } from "@/ui/components/dataTable/cells";

const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand",
    cell: ({ row }) => (
      <AvatarCell
        imageUrl={row.original.logo_url}
        name={row.getValue("name")}
        isActive={row.original.status === "active"}
        activeColor="text-green-600"
        inactiveColor="text-red-600"
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <DateCell
        value={row.getValue("createdAt")}
        isShowDateOnly={false} // Show date + time
      />
    ),
  },
];
```

### Custom Actions Column

```tsx
const customActions: CustomAction[] = [
  {
    type: "custom",
    placement: "cell",
    icon: <Star className="h-4 w-4" />,
    tooltip: "Mark as Featured",
    onClick: (row) => markFeatured(row._id),
    variant: "ghost",
  },
];

<DataTable
  columns={columns}
  customActions={customActions}
  operations={{
    getAllData: api.getAll,
    queryKey: queryKeys.all(),
  }}
/>
```

### Override Default Edit Action

```tsx
const customActions: CustomAction[] = [
  {
    type: "edit", // Overrides default edit
    placement: "cell",
    onClick: (row) => router.push(`/brands/${row._id}/edit`), // Navigate instead of modal
  },
];

<DataTable
  columns={columns}
  customActions={customActions}
  operations={{
    getAllData: api.getAll,
    queryKey: queryKeys.all(),
  }}
/>
```

---

## 16. TODOs & Future Improvements

1. **Server-side sorting:**
   - Add `sortBy` and `sortOrder` to queryKey
   - Pass to API: `?sortBy=name&sortOrder=asc`
   - Update backend to handle dynamic sorting

2. **Export to CSV/Excel:**
   - Add toolbar action: `{ label: "Export", onClick: exportToCSV }`
   - Implement `exportToCSV` using `react-csv` or `xlsx` library
   - Respect current filters and pagination

3. **Column resizing:**
   - Enable TanStack Table column resizing API
   - Add resize handles to table headers
   - Persist column widths to localStorage

4. **Virtual scrolling for large datasets:**
   - Integrate `@tanstack/react-virtual`
   - Replace pagination with infinite scroll
   - Optimize for 10,000+ rows

5. **Filter persistence:**
   - Save filters to localStorage or URL query params
   - Restore on page load
   - Share filtered table URLs

6. **Advanced date filters:**
   - Add presets: "Last 7 days", "This month", "Last year"
   - Custom date ranges with time selection
   - Relative dates: "Today", "Yesterday", "Last week"

7. **Multi-select filters:**
   - Support `type: "multi-select"` in FilterField
   - Render as checkbox group or multi-select dropdown
   - Send as array: `?categories=["electronics","clothing"]`

---

## 17. ASSUMPTIONS

### Assumptions Made in This Documentation

1. **Backend API follows REST conventions:**
   - GET `/api/{resource}` returns `{ success: true, data: { items: [], total, page, limit, totalPages, hasNext, hasPrev } }`
   - POST `/api/{resource}` creates resource, returns created item
   - PUT `/api/{resource}/:id` updates resource, returns updated item
   - DELETE `/api/{resource}/:id` deletes resource, returns success message

2. **Pagination indexing:**
   - Backend uses **1-based page numbers** (page 1 = first page)
   - TanStack Table uses **0-based pageIndex** (pageIndex 0 = first page)
   - DataTable component handles conversion automatically
   - Internal state (`page`) uses 1-based to match backend

3. **TanStack Query setup:
   - `QueryClientProvider` wraps app in `layout.tsx`
   - Mutations invalidate queries on success

4. **Form validation:
   - `DynamicFormConfig` fields have `validation` prop (Zod schema generated)
   - `required: true` adds Zod `.min(1)` validation

5. **File upload:
   - Backend expects `multipart/form-data` with `FormData`
   - File fields use `multer` or similar middleware
   - Returns uploaded file URL in response

6. **Date handling:
   - Backend stores dates as ISO 8601 strings or Date objects
   - Frontend converts to ISO strings before sending
   - `DateCell` uses `date-fns-tz` for timezone formatting

7. **Authentication:
   - API client includes auth token in headers (not shown in docs)
   - Backend validates token and returns 401 if expired

8. **Error handling:
   - Mutations show toast notifications on error (handled by `DynamicForm`)
   - `ErrorBoundaryFallback` catches useQuery errors and shows retry button

9. **Browser support:
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - ES2020+ features used (nullish coalescing, optional chaining)

---

## Appendix: Related Files

- **Types:** `types/DataTable.ts`, `types/filter.ts`
- **API Client:** `lib/api-client.ts` (filter serialization)
- **Query Keys:** `lib/query-keys.ts` (TanStack Query cache keys)
- **Hooks:** `hooks/use-crud-handlers.ts`, `hooks/queries/*` (mutations)
- **Form:** `ui/components/form/index.tsx`, `ui/components/form/type.ts`
- **Filters:** `ui/components/filters/global-filter.tsx`, `ui/components/filters/filter-field-renderer.tsx`
- **UI:** `ui/components/easy-alert-dialog.tsx`, `ui/components/date-picker.tsx`, `ui/components/date-range-picker.tsx`

---

**End of Documentation**  
Last Updated: 2025-12-14  
Version: 1.0.0 (Stable)
