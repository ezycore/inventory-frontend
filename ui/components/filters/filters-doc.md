---
title: Filters Component Documentation
version: 1.0.0
entry: ui/components/filters/global-filter.tsx
components:
  - global-filter.tsx
  - filter-field-renderer.tsx
lastUpdated: 2025-12-14
status: stable
---

# Filters Component - Complete Reference

## 1. Overview

The **Filters** system provides a flexible, reusable filtering UI that can be rendered as a **Sheet** (mobile-optimized sidebar) or **Popover** (desktop dropdown). It supports 8 field types with automatic serialization, conditional visibility, and both manual and auto-apply modes.

**Key Features:**
- 8 field types: text, select, checkbox, date, date-range, number, number-range, boolean
- Two view modes: Sheet (sidebar) and Popover (dropdown)
- Auto-apply or manual apply modes
- Conditional field visibility based on other values
- Responsive grid layout (1-4 columns)
- Active filter count badge
- Empty value filtering (automatic cleanup)
- Integrated with DataTable component

---

## 2. Quick Start

### Minimal Usage (Text + Select Filters)

```tsx
import { DataTable } from "@/ui/components/dataTable";
import { FilterConfig } from "@/types/DataTable";

const filterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search",
      type: "text",
      placeholder: "Search by name...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
  viewMode: 'popover',
  columns: 2,
};

<DataTable
  columns={columns}
  filterConfig={filterConfig}
  operations={{
    getAllData: brandsApi.getAll,
    queryKey: queryKeys.brands.all(),
  }}
/>
```

### Standalone Usage (Without DataTable)

> Both **DataTable and DataCard** now render the inline **`FilterBar`** (controls
> packed inline, overflow folds to a panel). `GlobalFilter` below is the
> **panel-only** standalone alternative (button → Sheet/Popover) for surfaces that
> aren't a DataTable/DataCard. Search is just a `type: "text"` field placed first
> in `filterConfig` — there is no separate search box anymore.

```tsx
import { GlobalFilter } from "@/ui/components/filters/global-filter";
import { FilterConfig } from "@/types/DataTable";

const filterConfig: FilterConfig = {
  fields: [...],
  onApply: (filters) => {
    console.log('Applied filters:', filters);
    // Fetch data with filters
    fetchData(filters);
  },
  onReset: () => {
    console.log('Filters reset');
    // Fetch data without filters
    fetchData({});
  },
};

<GlobalFilter config={filterConfig} />
```

---

## 3. Type Definitions

### FilterConfig Interface

```typescript
interface FilterConfig {
  /** Array of filter field definitions */
  fields?: FilterField[];
  
  /** Grid columns for layout (1-4) */
  columns?: 1 | 2 | 3 | 4;
  
  /** Display mode: 'sheet' (sidebar) or 'popover' (dropdown) */
  viewMode?: 'sheet' | 'popover';
  
  /** Auto-apply filters on field change (no Apply button needed) */
  applyOnChange?: boolean;
  
  /** Show Reset All button */
  showResetButton?: boolean;
  
  /** Show Apply Filters button (ignored if applyOnChange is true) */
  showApplyButton?: boolean;
  
  /** Callback when filters are applied */
  onApply?: (filters: Record<string, any>) => void;
  
  /** Callback when filters are reset */
  onReset?: () => void;
}
```

### FilterField Interface

```typescript
interface FilterField {
  /** Unique field identifier (used as API parameter name) */
  name: string;
  
  /** Display label */
  label: string;
  
  /** Field type */
  type: FilterFieldType;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Options for select/checkbox types */
  options?: FilterOption[];
  
  /** Default value */
  defaultValue?: any;
  
  // Layout
  /** Number of columns to span (1-4) */
  columnSpan?: number;
  
  // API Mapping
  /** Map to different API parameter name */
  apiKey?: string;
  
  // Validation
  /** Minimum value (for number types) */
  min?: number;
  
  /** Maximum value (for number types) */
  max?: number;
  
  // Conditional Visibility
  /** Field name this depends on */
  dependsOn?: string;
  
  /** Function to determine if field should be shown */
  showWhen?: (values: Record<string, any>) => boolean;
}
```

### FilterFieldType (8 Types)

```typescript
type FilterFieldType =
  | "text"        // Single-line text input
  | "select"      // Dropdown select
  | "checkbox"    // Multiple checkboxes
  | "date"        // Single date picker
  | "date-range"  // Date range picker (from - to)
  | "number"      // Number input
  | "number-range"// Number range (min - max)
  | "boolean";    // Single checkbox (true/false)
```

### FilterOption Interface

```typescript
interface FilterOption {
  label: string;
  value: string | number | boolean;
}
```

---

## 4. Field Types Reference

### 4.1 Text Field

**Use Case:** Search by name, description, or any text field.

```typescript
{
  name: "search",
  label: "Search",
  type: "text",
  placeholder: "Search by name...",
}
```

**Rendered As:** `<Input type="text" />`  
**Output Value:** `string | ""`  
**API Example:** `?search=iPhone`

---

### 4.2 Select Field

**Use Case:** Single selection from predefined options (status, category, etc.).

```typescript
{
  name: "status",
  label: "Status",
  type: "select",
  placeholder: "All statuses",
  options: [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ],
}
```

**Rendered As:** a single-mode select whose renderer is chosen automatically by `shouldUseSearchableSelect()` (`ui/components/select-strategy.ts`) — the same auto-strategy the DynamicForm uses. A remote (`optionsApi`) or long (> 10 static `options`) list renders the searchable `FuseAdvancedSelect` (Fuse.js combobox); a short static enum stays the plain `AdvancedSelect` (Radix `Select`).

- Notes:
  - Search comes for free on remote/long lists — you don't configure it. Short static enums (status, yes/no) stay a plain dropdown where a search box would be noise.
  - Supports `optionsApi` (string) to fetch options via a query hook; includes built-in loading and error states while fetching.
  - The filter renderer preserves the original option value types (string | number | boolean) — values are converted to strings for the UI and converted back to their original types when applied.

**Output Value:** `string | ""` (single mode) — original option types preserved when filters are serialized for the API.  
**API Example:** `?status=active`

---

### 4.3 Checkbox Field

**Use Case:** Multiple selections (tags, categories, features).

```typescript
{
  name: "tags",
  label: "Tags",
  type: "checkbox",
  options: [
    { label: "Featured", value: "featured" },
    { label: "New", value: "new" },
    { label: "Sale", value: "sale" },
  ],
}
```

**Rendered As:** Multiple `<Checkbox>` components  
**Output Value:** `string[] | []`  
**API Example:** `?tags=["featured","sale"]` (JSON array)

---

### 4.4 Date Field

**Use Case:** Single date selection (created after, updated on, etc.).

```typescript
{
  name: "updatedAt",
  label: "Updated Date",
  type: "date",
  placeholder: "Select date",
}
```

**Rendered As:** `<DatePicker>` (calendar popover)  
**Output Value:** `string (ISO 8601)` or `undefined`  
**API Example:** `?updatedAt=2024-01-15T00:00:00.000Z`

**Backend Parsing:**
```typescript
if (req.query.updatedAt) {
  filters.updatedAt = { $gte: new Date(req.query.updatedAt) };
}
```

---

### 4.5 Date-Range Field

**Use Case:** Date range selection (created between, period filtering).

```typescript
{
  name: "createdAt",
  label: "Created Date",
  type: "date-range",
  placeholder: "Select date range",
  columnSpan: 2,
}
```

**Rendered As:** `<DateRangePicker>` (dual-month calendar)  
**Output Value:** `{ from?: string, to?: string }` or `undefined`  
**API Example:** `?createdAt={"from":"2024-01-01T00:00:00.000Z","to":"2024-12-31T23:59:59.999Z"}`

**Backend Parsing:**
```typescript
if (req.query.createdAt) {
  const dateValue = JSON.parse(req.query.createdAt as string);
  filters.createdAt = {
    $gte: new Date(dateValue.from),
    $lte: new Date(dateValue.to),
  };
}
```

---

### 4.6 Number Field

**Use Case:** Single number input (price, quantity, age).

```typescript
{
  name: "quantity",
  label: "Quantity",
  type: "number",
  placeholder: "Enter quantity",
  min: 0,
  max: 1000,
}
```

**Rendered As:** `<Input type="number" />`  
**Output Value:** `number | ""`  
**API Example:** `?quantity=50`

---

### 4.7 Number-Range Field

**Use Case:** Range filtering (price range, stock range).

```typescript
{
  name: "priceRange",
  label: "Price Range",
  type: "number-range",
  min: 0,
  max: 10000,
}
```

**Rendered As:** Two `<Input type="number" />` (Min and Max)  
**Output Value:** `{ min?: number, max?: number }` or `undefined`  
**API Example:** `?priceRange={"min":100,"max":500}`

**Backend Parsing:**
```typescript
if (req.query.priceRange) {
  const range = JSON.parse(req.query.priceRange as string);
  filters.price = {};
  if (range.min) filters.price.$gte = range.min;
  if (range.max) filters.price.$lte = range.max;
}
```

---

### 4.8 Boolean Field

**Use Case:** True/false toggle (in stock, featured, active only).

```typescript
{
  name: "inStock",
  label: "In Stock Only",
  type: "boolean",
  defaultValue: false,
}
```

**Rendered As:** `<Checkbox>` (single)  
**Output Value:** `boolean`  
**API Example:** `?inStock=true`

---

## 5. Configuration Options

### 5.1 View Modes

#### Sheet Mode (Mobile-Optimized Sidebar)

```typescript
{
  viewMode: 'sheet', // Default
  // ...fields
}
```

**Behavior:**
- Opens as full-width sidebar on mobile
- Max-width sidebar on desktop (`sm:max-w-lg`)
- Slide-in animation from right
- Full-height scrollable content
- Header with title and description
- Footer with buttons (full-width on mobile, auto-width on desktop)

**Best For:**
- Mobile-first applications
- Complex filters with many fields
- When you need more vertical space

---

#### Popover Mode (Desktop Dropdown)

```typescript
{
  viewMode: 'popover',
  // ...fields
}
```

**Behavior:**
- Opens as floating dropdown near trigger button
- Fixed width (`w-[600px]`)
- Aligned to start (left-aligned)
- Compact layout
- No slide animation (instant)

**Best For:**
- Desktop applications
- Compact filter UIs
- When you want filters near the trigger

---

### 5.2 Grid Layout (1-4 Columns)

```typescript
{
  columns: 2, // Default: 2 columns
  // Responsive behavior:
  // columns: 1 → Always 1 column
  // columns: 2 → 1 on mobile, 2 on sm+
  // columns: 3 → 1 on mobile, 2 on sm+, 3 on lg+
  // columns: 4 → 1 on mobile, 2 on sm+, 4 on lg+
}
```

**Example: 3-Column Layout**
```typescript
{
  fields: [
    { name: "name", type: "text" },       // Col 1
    { name: "status", type: "select" },   // Col 2
    { name: "category", type: "select" }, // Col 3
    { name: "price", type: "number" },    // Col 1 (wraps)
  ],
  columns: 3,
}
```

---

### 5.3 Column Spanning

```typescript
{
  fields: [
    { name: "search", type: "text", columnSpan: 2 }, // Takes 2 columns
    { name: "status", type: "select" },              // Takes 1 column
    { name: "date", type: "date-range", columnSpan: 3 }, // Takes 3 columns
  ],
  columns: 3,
}
```

**Rules:**
- `columnSpan` only works with `columns: 2, 3, or 4`
- If `columnSpan` exceeds `columns`, it uses max available columns
- Date-range fields typically use `columnSpan: 2` for better UX

---

### 5.4 Apply Modes

#### Manual Apply (Default)

```typescript
{
  applyOnChange: false, // Default
  showApplyButton: true, // Default
}
```

**Behavior:**
- User changes fields
- Clicks "Apply Filters" button
- `onApply` callback fires
- Sheet/Popover closes

**Best For:** API-heavy filters where you want to minimize requests.

---

#### Auto-Apply (Instant Filtering)

```typescript
{
  applyOnChange: true,
  showApplyButton: false, // Hide Apply button (not needed)
}
```

**Behavior:**
- User changes any field
- `onApply` callback fires immediately
- Sheet/Popover stays open

**Best For:** Client-side filtering or fast APIs.

---

### 5.5 Reset Button

```typescript
{
  showResetButton: true, // Default
  onReset: () => {
    console.log('Filters reset');
    // Refetch data without filters
  },
}
```

**Behavior:**
- Resets all fields to `defaultValue` or empty string
- Calls `onReset` callback
- Closes Sheet/Popover

---

## 6. Advanced Features

### 6.1 Conditional Visibility

**Use Case:** Show "Subcategory" field only when "Category" is selected.

```typescript
{
  fields: [
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Clothing", value: "clothing" },
      ],
    },
    {
      name: "subcategory",
      label: "Subcategory",
      type: "select",
      options: [...],
      showWhen: (values) => !!values.category, // Only show if category is selected
    },
  ],
}
```

**Advanced Example:**
```typescript
{
  name: "discount",
  label: "Discount",
  type: "number",
  showWhen: (values) => values.status === "sale", // Only for sale items
}
```

---

### 6.2 Default Values

```typescript
{
  fields: [
    {
      name: "status",
      type: "select",
      defaultValue: "active", // Pre-select "Active"
      options: [...],
    },
    {
      name: "inStock",
      type: "boolean",
      defaultValue: true, // Checked by default
    },
  ],
}
```

**Behavior:**
- Fields initialize with `defaultValue`
- Reset button restores `defaultValue` (not empty)
- If `defaultValue` is not empty, it's included in initial `onApply`

---

### 6.3 API Key Mapping

**Use Case:** Frontend uses `"brand"` but backend expects `"brandId"`.

```typescript
{
  name: "brand",
  label: "Brand",
  type: "select",
  apiKey: "brandId", // Send as ?brandId=123 instead of ?brand=123
  options: [...],
}
```

**Note:** Currently not implemented in DataTable. Feature placeholder.

---

### 6.4 Custom Trigger Button

```typescript
import { Filter } from "lucide-react";
import { Button } from "@ui/components/button";

const customTrigger = (
  <Button variant="ghost" size="sm">
    <Filter className="h-4 w-4 mr-2" />
    Advanced Filters
  </Button>
);

<GlobalFilter config={filterConfig} trigger={customTrigger} />
```

---

### 6.5 Active Filter Count Badge

**Automatic:** Badge shows count of non-empty filters.

```typescript
// Automatically rendered on default trigger button
<Button variant="outline">
  Filters
  {activeCount > 0 && <Badge>{activeCount}</Badge>}
</Button>
```

**Active Count Logic:**
- Text/Select/Number: Non-empty string/number
- Checkbox: Array with length > 0
- Date/Date-range: Non-undefined value
- Boolean: Always counted (true/false)

---

## 7. Integration with DataTable

### Automatic Integration

```typescript
<DataTable
  filterConfig={filterConfig} // Filters automatically integrate
  operations={{
    getAllData: brandsApi.getAll,
    queryKey: queryKeys.brands.all(),
  }}
/>
```

**What DataTable Does:**
1. Adds `onApply` callback to set internal filter state
2. Adds `onReset` callback to clear filters
3. Resets page to 1 when filters change
4. Merges filters into queryKey
5. Passes filters to `getAllData({ page, limit, ...filters })`

**Example Query:**
```
GET /api/brands?page=1&limit=10&status=active&createdAt={"from":"2024-01-01","to":"2024-12-31"}
```

---

## 8. useFilters Hook

**Location:** `hooks/use-filters.ts`

### API Reference

```typescript
const {
  values,         // Current filter values (Record<string, any>)
  updateField,    // (name: string, value: any) => void
  apply,          // () => void - Apply filters and close
  reset,          // () => void - Reset to defaults
  clearField,     // (name: string) => void - Clear single field
  activeCount,    // number - Count of active filters
  isOpen,         // boolean - Sheet/Popover open state
  setIsOpen,      // (open: boolean) => void
} = useFilters(fields, onApply, applyOnChange);
```

### Internal Behavior

1. **Initialization:**
   - Creates state with `defaultValue` for each field
   - Empty string if no `defaultValue`

2. **updateField:**
   - Updates single field in state
   - Triggers auto-apply if `applyOnChange: true`

3. **apply:**
   - Filters out empty values (empty strings, null, undefined, empty arrays)
   - Calls `onApply` with active filters only
   - Closes Sheet/Popover

4. **reset:**
   - Resets all fields to `defaultValue` or empty string
   - Calls `onApply` with defaults (may include non-empty defaults)
   - Closes Sheet/Popover

5. **activeCount:**
   - Counts non-empty values
   - Arrays: length > 0
   - Others: not empty string, null, or undefined

---

## 9. Serialization & Backend Parsing

### Frontend Serialization (lib/api-client.ts)

```typescript
const params = new URLSearchParams();
Object.entries(filters).forEach(([key, value]) => {
  if (typeof value === 'object' && value !== null) {
    params.append(key, JSON.stringify(value)); // Serialize objects
  } else {
    params.append(key, String(value)); // Simple values as strings
  }
});
```

### Filter Type Serialization Table

| Field Type | Frontend Value | Serialized | Backend Parsing |
|------------|---------------|------------|-----------------|
| `text` | `"iPhone"` | `?search=iPhone` | `req.query.search` |
| `select` | `"active"` | `?status=active` | `req.query.status` |
| `checkbox` | `["new","sale"]` | `?tags=["new","sale"]` | `JSON.parse(req.query.tags)` |
| `date` | `"2024-01-15T00:00:00.000Z"` | `?date=2024-01-15T00:00:00.000Z` | `new Date(req.query.date)` |
| `date-range` | `{from:"2024-01-01",to:"2024-12-31"}` | `?dateRange={"from":"...","to":"..."}` | `JSON.parse(req.query.dateRange)` |
| `number` | `50` | `?quantity=50` | `Number(req.query.quantity)` |
| `number-range` | `{min:100,max:500}` | `?price={"min":100,"max":500}` | `JSON.parse(req.query.price)` |
| `boolean` | `true` | `?inStock=true` | `req.query.inStock === 'true'` |

---

### Backend Example (Express + MongoDB)

```typescript
// brand list controller — backend example
export const getAll = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const filters: any = {};

  // Text filter
  if (req.query.search) {
    filters.name = { $regex: req.query.search, $options: 'i' };
  }

  // Select filter
  if (req.query.status) {
    filters.status = req.query.status;
  }

  // Date-range filter
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
      // Fallback to single date
      filters.createdAt = { $gte: new Date(req.query.createdAt as string) };
    }
  }

  // Number-range filter
  if (req.query.priceRange) {
    const range = JSON.parse(req.query.priceRange as string);
    filters.price = {};
    if (range.min) filters.price.$gte = range.min;
    if (range.max) filters.price.$lte = range.max;
  }

  // Checkbox filter (array)
  if (req.query.tags) {
    const tags = JSON.parse(req.query.tags as string);
    filters.tags = { $in: tags };
  }

  // Boolean filter
  if (req.query.inStock) {
    filters.stock = req.query.inStock === 'true' ? { $gt: 0 } : { $lte: 0 };
  }

  const items = await Brand.find(filters)
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Brand.countDocuments(filters);

  res.json({
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
  });
};
```

---

## 10. Complete Examples

### Example 1: E-commerce Product Filters

```typescript
const productFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search Products",
      type: "text",
      placeholder: "Search by name or SKU...",
      columnSpan: 2,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Clothing", value: "clothing" },
        { label: "Home & Garden", value: "home" },
      ],
    },
    {
      name: "brand",
      label: "Brand",
      type: "select",
      options: brandOptions,
    },
    {
      name: "priceRange",
      label: "Price Range",
      type: "number-range",
      min: 0,
      max: 10000,
      columnSpan: 2,
    },
    {
      name: "tags",
      label: "Features",
      type: "checkbox",
      options: [
        { label: "Featured", value: "featured" },
        { label: "New Arrival", value: "new" },
        { label: "On Sale", value: "sale" },
        { label: "Free Shipping", value: "free-shipping" },
      ],
    },
    {
      name: "inStock",
      label: "In Stock Only",
      type: "boolean",
      defaultValue: false,
    },
    {
      name: "createdAt",
      label: "Added Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
  ],
  viewMode: 'sheet',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};
```

---

### Example 2: User Management Filters

```typescript
const userFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search Users",
      type: "text",
      placeholder: "Search by name or email...",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Manager", value: "manager" },
        { label: "User", value: "user" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Suspended", value: "suspended" },
      ],
    },
    {
      name: "permissions",
      label: "Permissions",
      type: "checkbox",
      options: [
        { label: "Can Edit", value: "edit" },
        { label: "Can Delete", value: "delete" },
        { label: "Can Publish", value: "publish" },
      ],
    },
    {
      name: "registeredAt",
      label: "Registration Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
};
```

---

### Example 3: Conditional Visibility

```typescript
const orderFilterConfig: FilterConfig = {
  fields: [
    {
      name: "status",
      label: "Order Status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      name: "trackingNumber",
      label: "Tracking Number",
      type: "text",
      placeholder: "Enter tracking number",
      showWhen: (values) => values.status === "shipped", // Only show for shipped orders
    },
    {
      name: "deliveryDate",
      label: "Delivery Date",
      type: "date",
      showWhen: (values) => values.status === "delivered", // Only show for delivered orders
    },
    {
      name: "cancellationReason",
      label: "Cancellation Reason",
      type: "select",
      options: [
        { label: "Out of Stock", value: "out-of-stock" },
        { label: "Customer Request", value: "customer-request" },
        { label: "Payment Failed", value: "payment-failed" },
      ],
      showWhen: (values) => values.status === "cancelled", // Only show for cancelled orders
    },
  ],
  viewMode: 'sheet',
  columns: 2,
};
```

---

### Example 4: Auto-Apply (Instant Filtering)

```typescript
const clientSideFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Quick Search",
      type: "text",
      placeholder: "Type to filter...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All", value: "all" }, // Non-empty sentinel — Select.Item forbids ""
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
  viewMode: 'popover',
  applyOnChange: true, // Instant filtering
  showApplyButton: false, // No Apply button needed
  showResetButton: true,
  onApply: (filters) => {
    // Filter client-side data
    const filtered = data.filter(item => {
      if (filters.search && !item.name.includes(filters.search)) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
    setFilteredData(filtered);
  },
};
```

---

## 11. Common Patterns & Best Practices

### Pattern 1: Date Filters Always Use columnSpan: 2

```typescript
{
  name: "createdAt",
  type: "date-range",
  columnSpan: 2, // Date pickers need more space
}
```

**Why:** Date pickers (especially date-range) are wider and more readable with extra space.

---

### Pattern 2: Provide "All" Option in Select Filters

```typescript
{
  name: "status",
  type: "select",
  options: [
    { label: "All", value: "all" }, // Non-empty sentinel — strip it before the API call
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ],
}
```

**Why:** Users need a way to clear single-select filters without clicking Reset.
**Never use `value: ""`** — Radix `Select.Item` throws (empty string is reserved for clearing).
Use a sentinel like `"all"` and drop it when building the query (`buildQueryParams` already
skips `undefined`/`""`, so remove the key or map it to `undefined`).

---

### Pattern 3: Use Popover for Desktop, Sheet for Mobile

```typescript
const isMobile = useMediaQuery("(max-width: 768px)");

const filterConfig: FilterConfig = {
  fields: [...],
  viewMode: isMobile ? 'sheet' : 'popover',
};
```

---

### Pattern 4: Group Related Filters with columnSpan

```typescript
{
  fields: [
    { name: "minPrice", type: "number", columnSpan: 1 },
    { name: "maxPrice", type: "number", columnSpan: 1 }, // Side by side
    { name: "category", type: "select", columnSpan: 2 }, // Full width
  ],
  columns: 2,
}
```

---

### Pattern 5: Use defaultValue for Common Filters

```typescript
{
  name: "status",
  type: "select",
  defaultValue: "active", // Most users want active items
  options: [...],
}
```

---

## 12. Troubleshooting

### Issue 1: Filters Not Applied

**Problem:** User clicks "Apply Filters" but data doesn't change.

**Solution:** Ensure `onApply` callback is wired to data fetching:

```typescript
// ✅ CORRECT - With DataTable (automatic)
<DataTable filterConfig={filterConfig} operations={{...}} />

// ✅ CORRECT - Standalone (manual)
<GlobalFilter config={{
  ...filterConfig,
  onApply: (filters) => {
    fetchData(filters); // Trigger data fetch
  },
}} />
```

---

### Issue 2: Date-Range Not Parsing

**Problem:** Backend receives `[object Object]` for date-range.

**Solution:** Backend must JSON.parse date-range values:

```typescript
// ❌ WRONG
const createdAt = req.query.createdAt; // "[object Object]"

// ✅ CORRECT
const createdAt = JSON.parse(req.query.createdAt as string);
// { from: "2024-01-01T00:00:00.000Z", to: "2024-12-31T23:59:59.999Z" }
```

---

### Issue 3: Empty Filters Sent to Backend

**Problem:** Backend receives `?status=&search=` (empty values).

**Solution:** useFilters automatically filters empty values in `apply()`. If you see empty values, check if you're bypassing the hook:

```typescript
// ❌ WRONG - Sends all values
const allValues = values;
onApply(allValues);

// ✅ CORRECT - Filters empty values
const activeFilters = Object.entries(values).reduce((acc, [key, value]) => {
  if (value !== '' && value !== null && value !== undefined) {
    if (Array.isArray(value) && value.length === 0) return acc;
    acc[key] = value;
  }
  return acc;
}, {});
onApply(activeFilters);
```

---

### Issue 4: Sheet Not Closing on Apply

**Problem:** User clicks "Apply Filters" but Sheet stays open.

**Solution:** `apply()` function automatically calls `setIsOpen(false)`. Ensure you're not overriding this:

```typescript
// ❌ WRONG
onApply: (filters) => {
  fetchData(filters);
  // Sheet doesn't close because you didn't call setIsOpen(false)
}

// ✅ CORRECT - Use default apply() from useFilters
const { apply } = useFilters(fields, onApply);
// apply() handles closing automatically
```

---

### Issue 5: Conditional Field Not Showing

**Problem:** Field with `showWhen` never appears.

**Solution:** Check `showWhen` logic and ensure dependent field updates state:

```typescript
// Debug: Log values in showWhen
showWhen: (values) => {
  console.log('Current values:', values);
  console.log('Status:', values.status);
  return values.status === 'shipped';
}
```

---

## 13. Testing Checklist

### Unit Tests

- [ ] `useFilters` initializes with default values
- [ ] `updateField` updates single field
- [ ] `apply` filters empty values before calling `onApply`
- [ ] `reset` restores default values
- [ ] `activeCount` counts non-empty values correctly
- [ ] Auto-apply triggers `onApply` on field change

### Integration Tests

- [ ] GlobalFilter renders in Sheet mode
- [ ] GlobalFilter renders in Popover mode
- [ ] Filter fields render correctly for all 8 types
- [ ] Apply button calls `onApply` with active filters
- [ ] Reset button clears all fields and calls `onReset`
- [ ] Active count badge updates correctly
- [ ] Conditional fields show/hide based on `showWhen`

### UI/Visual Tests

- [ ] Sheet slides in from right on mobile
- [ ] Popover aligns correctly near trigger
- [ ] Grid layout responsive (1 col mobile, 2+ cols desktop)
- [ ] columnSpan works correctly
- [ ] Date pickers are readable (sufficient size)
- [ ] Buttons are full-width on mobile, auto-width on desktop

### Accessibility Tests

- [ ] All fields have labels
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces field types
- [ ] Focus trap works in Sheet/Popover
- [ ] Esc key closes Sheet/Popover

---

## 14. API Reference Summary

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `GlobalFilter` | `global-filter.tsx` | Main filter container (Sheet or Popover) |
| `FilterFieldRenderer` | `filter-field-renderer.tsx` | Renders individual filter fields |

### Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useFilters` | `hooks/use-filters.ts` | Manages filter state and logic |

### Types

| Type | File | Purpose |
|------|------|---------|
| `FilterConfig` | `types/DataTable.ts` | Filter configuration interface |
| `FilterField` | `types/filter.ts` | Single field definition |
| `FilterFieldType` | `types/filter.ts` | Field type enum |
| `FilterOption` | `types/filter.ts` | Select/Checkbox option |
| `FilterValues` | `types/filter.ts` | Filter values object |

---

## 15. ASSUMPTIONS

### Assumptions Made in This Documentation

1. **Filter serialization:**
   - Objects (date-range, number-range, arrays) are JSON.stringified
   - Simple values (text, select, number) are sent as strings
   - Backend must JSON.parse object filters

2. **Empty value handling:**
   - Empty strings, null, undefined are filtered out before `onApply`
   - Empty arrays (`[]`) are filtered out
   - Boolean false is NOT filtered out (it's a valid value)

3. **Backend API:**
   - Backend expects query parameters in URL
   - Backend parses JSON strings for complex filters
   - Backend returns data in `ApiResponse<PaginatedResponse<T>>` format

4. **Date handling:**
   - All dates are ISO 8601 strings
   - Timezone handling is done by DateCell component (user's timezone)
   - Backend stores dates as Date objects or ISO strings

5. **Conditional visibility:**
   - `showWhen` is evaluated on every state change
   - Hidden fields do NOT send values to `onApply`
   - Dependent fields are cleared when parent changes (manual implementation required)

6. **Browser support:**
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - ES2020+ features (optional chaining, nullish coalescing)
   - No IE11 support

---

## Appendix: Related Files

- **Components:**
  - `ui/components/filters/global-filter.tsx` - Main filter container
  - `ui/components/filters/filter-field-renderer.tsx` - Field renderer
  - `ui/components/date-picker.tsx` - Single date picker
  - `ui/components/date-range-picker.tsx` - Date range picker

- **Hooks:**
  - `hooks/use-filters.ts` - Filter state management

- **Types:**
  - `types/filter.ts` - Filter type definitions
  - `types/DataTable.ts` - FilterConfig interface

- **UI Components:**
  - `ui/components/sheet.tsx` - Sheet (sidebar) component
  - `ui/components/popover.tsx` - Popover (dropdown) component
  - `ui/components/input.tsx` - Text/Number input
  - `ui/components/select.tsx` - Select dropdown
  - `ui/components/checkbox.tsx` - Checkbox
  - `ui/components/button.tsx` - Button
  - `ui/components/badge.tsx` - Badge (active count)

- **API Client:**
  - `lib/api-client.ts` - Filter serialization logic

---

**End of Documentation**  
Last Updated: 2025-12-14  
Version: 1.0.0 (Stable)
