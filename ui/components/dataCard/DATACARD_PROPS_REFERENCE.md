# DataCard Props Reference

A comprehensive guide to all DataCard props with examples.

---

## Table of Contents
1. [Basic Props](#basic-props)
2. [Layout Props](#layout-props)
3. [Styling Props](#styling-props)
4. [Field Configuration](#field-configuration)
5. [Image Configuration](#image-configuration)
6. [Action Configuration](#action-configuration)
7. [Operations (CRUD)](#operations-crud)
8. [Filter & Search](#filter--search)
9. [Empty State](#empty-state)
10. [Full Examples](#full-examples)

---

## Basic Props

### `cardTitle`
Section title displayed above the cards.

```tsx
// Static title
<DataCard cardTitle="Products" />

// Dynamic title with count
<DataCard cardTitle={(count) => `Products (${count})`} />
```

### `data`
External data source. Use when you don't need self-contained data fetching.

```tsx
const products = [
  { _id: "1", name: "Product A", price: 100 },
  { _id: "2", name: "Product B", price: 200 },
];

<DataCard data={products} />
```

### `loading`
Shows skeleton loading state.

```tsx
<DataCard loading={true} />
```

### `module`
**Reserved for future use.** Intended for storing user preferences (like layout, page size) per module. Not currently implemented.

```tsx
// Not currently functional
<DataCard module="products" />
```

### `defaultPageSize`
Initial items per page (default: 12).

```tsx
<DataCard defaultPageSize={24} />
```

### `pageSizes`
Available page size options.

```tsx
<DataCard pageSizes={[12, 24, 48, 96]} />
```

---

## Layout Props

### `layoutConfig`
Configure card layout grid.

```tsx
<DataCard
  layoutConfig={{
    layout: "grid",         // "grid" | "masonry" | "list"
    columns: {
      default: 1,           // Mobile: 1 column
      sm: 2,                // Small screens: 2 columns
      md: 3,                // Medium: 3 columns
      lg: 4,                // Large: 4 columns
      xl: 5,                // Extra large: 5 columns
    },
    gap: "md",              // "sm" | "md" | "lg"
  }}
/>
```

**Layout types:**
- `grid`: Standard CSS grid layout
- `masonry`: Pinterest-style masonry layout
- `list`: Single column list view

### `cardSize`
Card size variant.

```tsx
// Small cards
<DataCard cardSize="sm" />

// Medium cards (default)
<DataCard cardSize="md" />

// Large cards
<DataCard cardSize="lg" />
```

---

## Styling Props

### `variant`
Built-in card style variant.

```tsx
// Default card with image, header, body, footer
<DataCard variant="default" />

// Compact horizontal layout with avatar
<DataCard variant="compact" />

// Detailed card with gradient header
<DataCard variant="detailed" />
```

**Visual differences:**
- `default`: Full card with image on top, header with title/subtitle, body fields in grid, footer fields
- `compact`: Horizontal row layout, circular avatar, minimal fields
- `detailed`: Large hero image/gradient, prominent title, fields in rows with borders

### `cardClassName`
Custom card styles.

```tsx
// Static class
<DataCard cardClassName="bg-blue-50 border-blue-200" />

// Dynamic class based on row data
<DataCard 
  cardClassName={(row) => 
    row.status === "active" ? "border-green-500" : "border-red-500"
  } 
/>
```

### `enableCardHover`
Enable hover animation effects (default: true).

```tsx
// Disable hover effects
<DataCard enableCardHover={false} />

// Enable (default)
<DataCard enableCardHover={true} />
```

### `rounded`
Card border radius.

```tsx
<DataCard rounded="none" />  // No rounded corners
<DataCard rounded="sm" />    // Small radius
<DataCard rounded="md" />    // Medium radius
<DataCard rounded="lg" />    // Large radius (default)
<DataCard rounded="xl" />    // Extra large radius
<DataCard rounded="full" />  // Fully rounded
```

### `shadow`
Card shadow intensity.

```tsx
<DataCard shadow="none" />  // No shadow
<DataCard shadow="sm" />    // Small shadow (default)
<DataCard shadow="md" />    // Medium shadow
<DataCard shadow="lg" />    // Large shadow
```

---

## Field Configuration

### `fields`
Configure which fields to display and how.

```tsx
<DataCard
  fields={[
    // Title field (displayed prominently)
    { 
      key: "name", 
      label: "Product Name",
      isTitle: true,
    },
    
    // Subtitle field
    { 
      key: "category.name", 
      label: "Category",
      isSubtitle: true,
    },
    
    // Badge field with dynamic variant
    { 
      key: "status",
      label: "Status",
      isBadge: true,
      badgeVariant: (value) => 
        value === "active" ? "default" : "destructive",
    },
    
    // Custom render function
    { 
      key: "price",
      label: "Price",
      render: (value) => `$${value.toFixed(2)}`,
    },
    
    // Full width field (spans 2 columns)
    { 
      key: "description",
      label: "Description",
      span: 2,
    },
    
    // Footer field
    { 
      key: "createdAt",
      label: "Created",
      inFooter: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    
    // Hidden field (not displayed)
    { 
      key: "internalCode",
      hidden: true,
    },
  ]}
/>
```

**Field options:**
| Option | Type | Description |
|--------|------|-------------|
| `key` | `string` | Field key from data (supports nested: `category.name`) |
| `label` | `string` | Display label |
| `isTitle` | `boolean` | Show as card title |
| `isSubtitle` | `boolean` | Show as card subtitle |
| `isBadge` | `boolean` | Render as badge |
| `badgeVariant` | `function` | Dynamic badge color |
| `render` | `function` | Custom render function |
| `span` | `1 \| 2` | Column span in body grid |
| `inFooter` | `boolean` | Show in footer area |
| `hidden` | `boolean` | Hide this field |

---

## Image Configuration

### `imageConfig`
Configure card image/avatar display.

```tsx
// Basic image from field
<DataCard
  imageConfig={{
    src: "images",  // Field key containing image URL
    alt: "name",    // Field key for alt text
    aspectRatio: "video",  // "square" | "video" | "wide" | "portrait"
  }}
/>

// Image with function to extract URL
<DataCard
  imageConfig={{
    src: (row) => row.images?.[0]?.thumbnail?.url || row.images?.[0]?.url,
    alt: "name",
    aspectRatio: "square",
    fallback: (row) => row.name.charAt(0).toUpperCase(),
  }}
/>

// Avatar style (circular)
<DataCard
  imageConfig={{
    src: "avatarUrl",
    asAvatar: true,
    fallback: (row) => row.name.substring(0, 2).toUpperCase(),
  }}
/>

// Image position
<DataCard
  imageConfig={{
    src: "image",
    position: "top",      // "top" | "left" | "right" | "background"
  }}
/>
```

**Aspect ratios:**
- `square`: 1:1 ratio
- `video`: 16:9 ratio (default)
- `wide`: 2:1 ratio
- `portrait`: 3:4 ratio

---

## Action Configuration

### Built-in Actions via `operations`

```tsx
<DataCard
  operations={{
    updateMutation: useUpdateProduct(),  // Enables edit action
    deleteMutation: useDeleteProduct(),  // Enables delete action
    isViewAvailable: true,               // Enables view action
    editTooltip: "Edit this product",
    deleteTooltip: "Remove product",
    viewTooltip: "View details",
  }}
/>
```

### `customActions`
Add custom action buttons.

```tsx
<DataCard
  customActions={[
    // Header action (Add button alternative)
    {
      type: "create",
      placement: "header",
      label: "Add Product",
      icon: <Plus className="h-4 w-4 mr-2" />,
      href: "/products/new",  // Use Link
    },
    
    // Header action with onClick
    {
      type: "export",
      placement: "header",
      label: "Export",
      icon: <Download className="h-4 w-4 mr-2" />,
      onClick: () => handleExport(),
    },
    
    // Card menu action
    {
      type: "duplicate",
      placement: "menu",
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      tooltip: "Clone this item",
      onClick: (row) => handleDuplicate(row),
    },
    
    // Card footer action
    {
      type: "archive",
      placement: "footer",
      label: "Archive",
      icon: <Archive className="h-4 w-4" />,
      variant: "outline",
      onClick: (row) => handleArchive(row),
      disabled: (row) => row.status === "archived",
    },
    
    // Custom render action
    {
      type: "custom",
      placement: "menu",
      render: (row) => (
        <button onClick={() => console.log(row)}>
          Custom Action
        </button>
      ),
    },
  ]}
/>
```

**Placements:**
- `header`: Toolbar area (buttons)
- `menu`: Card dropdown menu (action appears in each card's "..." menu)
- `footer`: Card footer area (not yet implemented)

### `toolbarAction`
Primary action button in toolbar. Auto-generated from `operations` if `createMutation` is provided.

> **Note:** `toolbarAction` vs `customActions` with `placement: "header"`:
> - `toolbarAction` is for a simple, single primary action (like "Add Item")
> - `customActions` with `placement: "header"` allows multiple toolbar buttons
> - If you use `customActions` with `type: "create"` and `placement: "header"`, it takes precedence over `toolbarAction`

```tsx
<DataCard
  toolbarAction={{
    label: "Add Product",
    icon: <Plus className="h-4 w-4 mr-2" />,
    onClick: () => setIsOpen(true),
    variant: "default",  // "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }}
/>
```

### `renderCard`
Complete custom card rendering. **When using `renderCard`, styling props (`shadow`, `rounded`, `enableCardHover`, `cardClassName`) are NOT automatically applied** - you have full control over the card's appearance.

```tsx
<DataCard
  renderCard={(row, actions) => (
    <div className="p-4 border rounded-lg">
      <h3>{row.name}</h3>
      <p>{row.description}</p>
      <div className="flex gap-2">
        <button onClick={actions.onView}>View</button>
        <button onClick={actions.onEdit}>Edit</button>
        <button onClick={actions.onDelete}>Delete</button>
      </div>
    </div>
  )}
/>
```

---

## Operations (CRUD)

### `operations`
Complete CRUD configuration for self-contained data management.

```tsx
<DataCard
  operations={{
    // Data fetching
    getAllData: (params) => brandService.getAll(params),
    queryKey: ["brands"],
    
    // Form configuration
    formConfig: brandFormConfig,
    defaultValues: { name: "", status: "active" },
    
    // Mutations
    createMutation: useCreateBrand(),
    updateMutation: useUpdateBrand(),
    deleteMutation: useDeleteBrand(),
    bulkDeleteMutation: useBulkDeleteBrands(),
    
    // Entity name (for labels)
    entityName: "Brand",
    
    // View mode
    isViewAvailable: true,
    
    // Tooltips
    editTooltip: "Edit brand",
    deleteTooltip: "Delete brand",
    viewTooltip: "View brand details",
    
    // Form modal type
    openInside: "modal",  // "modal" | "drawer"
    
    // Transform data before editing
    transformEditData: (item) => ({
      ...item,
      categoryId: item.category._id,
    }),
    
    // Transform data before submit
    prepareSubmitData: (data, isEdit, originalItem) => {
      if (isEdit) {
        return { id: originalItem._id, ...data };
      }
      return data;
    },
    
    // Disabled fields in edit mode
    disabledFieldsInEdit: ["slug"],
  }}
/>
```

---

## Filter & Search

### `filterConfig`
Configure filter panel.

```tsx
<DataCard
  filterConfig={{
    fields: [
      { 
        name: "status", 
        label: "Status", 
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
      { 
        name: "category", 
        label: "Category", 
        type: "select",
        options: categories.map(c => ({ value: c._id, label: c.name })),
      },
      {
        name: "priceRange",
        label: "Price Range",
        type: "range",
      },
    ],
    columns: 2,              // Grid columns
    applyOnChange: false,    // Auto-apply on change
    showResetButton: true,
    showApplyButton: true,
    viewMode: "drawer",      // "drawer" | "popover"
  }}
/>
```

### Search (removed `searchConfig`)
`searchConfig` was removed — it filtered only the current server page. Add a
server-side `search` **text field, first** in `filterConfig` instead; the card
toolbar renders it inline via `FilterBar`.

```tsx
<DataCard
  filterConfig={{
    fields: [
      { name: "search", label: "Search", type: "text", placeholder: "Search products..." },
      // ...other filters
    ],
  }}
/>
```

### `selectable`
Enable card selection with checkboxes.

```tsx
<DataCard
  selectable={true}
  onSelectionChange={(selectedRows) => {
    console.log("Selected:", selectedRows);
  }}
/>
```

---

## Empty State

### `emptyMessage`
Custom empty state message.

```tsx
<DataCard emptyMessage="No products found" />
```

### `emptyIcon`
Custom empty state icon.

```tsx
<DataCard 
  emptyIcon={<Package className="h-16 w-16 text-muted-foreground" />} 
/>
```

### `emptyState`
Completely custom empty state component.

```tsx
<DataCard
  emptyState={
    <div className="flex flex-col items-center py-12">
      <Package className="h-20 w-20 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
      <p className="text-muted-foreground">Start by adding your first product</p>
      <Button className="mt-4" onClick={() => setIsOpen(true)}>
        Add Product
      </Button>
    </div>
  }
/>
```

---

## Full Examples

### Example 1: Simple Card Grid with External Data

```tsx
import { DataCard } from "@/ui/components/dataCard";

const products = [
  { _id: "1", name: "Product A", price: 100, status: "active", image: "/img/a.jpg" },
  { _id: "2", name: "Product B", price: 200, status: "inactive", image: "/img/b.jpg" },
];

<DataCard
  cardTitle="Products"
  data={products}
  variant="default"
  fields={[
    { key: "name", isTitle: true },
    { key: "price", label: "Price", render: (v) => `$${v}` },
    { key: "status", isBadge: true, badgeVariant: (v) => v === "active" ? "default" : "secondary" },
  ]}
  imageConfig={{
    src: "image",
    aspectRatio: "square",
  }}
/>
```

### Example 2: Full CRUD DataCard (Self-Contained)

```tsx
import { DataCard } from "@/ui/components/dataCard";
import { brandService } from "@/services/brand.service";
import { useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/mutations/brand";
import { brandFormConfig } from "@/config/forms/brand";

<DataCard
  cardTitle={(count) => `Brands (${count})`}
  variant="compact"
  layoutConfig={{
    layout: "grid",
    columns: { default: 1, sm: 2, lg: 3 },
    gap: "md",
  }}
  fields={[
    { key: "name", isTitle: true },
    { key: "products", isSubtitle: true, render: (v) => `${v?.length || 0} products` },
    { key: "status", isBadge: true },
  ]}
  imageConfig={{
    src: (row) => row.logo?.url,
    asAvatar: true,
    fallback: (row) => row.name.charAt(0),
  }}
  filterConfig={{
    fields: [
      { name: "search", label: "Search", type: "text", placeholder: "Search brands..." },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    viewMode: "popover",
  }}
  operations={{
    getAllData: brandService.getAll,
    queryKey: ["brands"],
    formConfig: brandFormConfig,
    defaultValues: { name: "", status: "active" },
    createMutation: useCreateBrand(),
    updateMutation: useUpdateBrand(),
    deleteMutation: useDeleteBrand(),
    entityName: "Brand",
    isViewAvailable: true,
    openInside: "modal",
  }}
  emptyMessage="No brands found"
  emptyIcon={<Tag className="h-12 w-12" />}
/>
```

### Example 3: Detailed Cards with Custom Actions

```tsx
<DataCard
  cardTitle="Orders"
  variant="detailed"
  enableCardHover={true}
  rounded="xl"
  shadow="md"
  layoutConfig={{
    layout: "grid",
    columns: { default: 1, md: 2, lg: 3 },
    gap: "lg",
  }}
  fields={[
    { key: "orderNumber", isTitle: true },
    { key: "customer.name", isSubtitle: true },
    { key: "status", isBadge: true, badgeVariant: getOrderStatusVariant },
    { key: "total", label: "Total", render: formatCurrency },
    { key: "items", label: "Items", render: (v) => `${v.length} items` },
    { key: "createdAt", label: "Date", inFooter: true, render: formatDate },
  ]}
  customActions={[
    {
      type: "create",
      placement: "header",
      label: "New Order",
      icon: <Plus className="h-4 w-4 mr-2" />,
      href: "/orders/new",
    },
    {
      type: "invoice",
      placement: "menu",
      label: "Download Invoice",
      icon: <FileText className="h-4 w-4" />,
      onClick: (row) => downloadInvoice(row._id),
    },
    {
      type: "ship",
      placement: "menu",
      label: "Mark as Shipped",
      icon: <Truck className="h-4 w-4" />,
      onClick: (row) => markAsShipped(row._id),
      disabled: (row) => row.status !== "processing",
    },
  ]}
  selectable={true}
  onSelectionChange={handleSelectionChange}
  operations={{
    getAllData: orderService.getAll,
    queryKey: ["orders"],
    deleteMutation: useDeleteOrder(),
    bulkDeleteMutation: useBulkDeleteOrders(),
    entityName: "Order",
    isViewAvailable: true,
  }}
/>
```

### Example 4: Complete Custom Card Rendering

```tsx
<DataCard
  cardTitle="Team Members"
  data={teamMembers}
  renderCard={(row, { onEdit, onView, onDelete }) => (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl text-white">
      <div className="flex items-center gap-4">
        <img 
          src={row.avatar} 
          alt={row.name}
          className="w-16 h-16 rounded-full border-2 border-white"
        />
        <div>
          <h3 className="font-bold text-lg">{row.name}</h3>
          <p className="text-white/80">{row.role}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button 
          onClick={onView}
          className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30"
        >
          Profile
        </button>
        <button 
          onClick={onEdit}
          className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30"
        >
          Edit
        </button>
      </div>
    </div>
  )}
  operations={{
    updateMutation: useUpdateMember(),
    deleteMutation: useDeleteMember(),
    formConfig: memberFormConfig,
    entityName: "Member",
  }}
/>
```

---

## Props Summary Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardTitle` | `string \| (count) => string` | - | Section title |
| `data` | `TData[]` | - | External data array |
| `loading` | `boolean` | `false` | Show loading skeletons |
| `defaultPageSize` | `number` | `12` | Initial items per page |
| `pageSizes` | `number[]` | `[12,24,48,96]` | Page size options |
| `layoutConfig` | `object` | - | Grid/masonry/list config |
| `cardSize` | `"sm" \| "md" \| "lg"` | `"md"` | Card size variant |
| `variant` | `"default" \| "compact" \| "detailed"` | `"default"` | Card style variant |
| `cardClassName` | `string \| (row) => string` | - | Custom card classes |
| `enableCardHover` | `boolean` | `true` | Hover animation |
| `rounded` | `"none" \| "sm" \| "md" \| "lg" \| "xl" \| "full"` | `"lg"` | Border radius |
| `shadow` | `"none" \| "sm" \| "md" \| "lg"` | `"sm"` | Shadow intensity |
| `fields` | `CardFieldConfig[]` | - | Field display config |
| `imageConfig` | `CardImageConfig` | - | Image/avatar config |
| `renderCard` | `(row, actions) => ReactNode` | - | Custom card render |
| `toolbarAction` | `object` | - | Primary toolbar button |
| `customActions` | `CardCustomAction[]` | - | Custom action buttons |
| `filterConfig` | `FilterConfig` | - | Filter config (put a `search` text field first for server-side search; rendered inline via `FilterBar`) |
| `selectable` | `boolean` | `false` | Enable selection |
| `onSelectionChange` | `(rows) => void` | - | Selection callback |
| `operations` | `Operations` | - | CRUD operations config |
| `emptyState` | `ReactNode` | - | Custom empty component |
| `emptyMessage` | `string` | `"No data"` | Empty state text |
| `emptyIcon` | `ReactNode` | - | Empty state icon |
| `module` | `string` | - | Module name for context |
