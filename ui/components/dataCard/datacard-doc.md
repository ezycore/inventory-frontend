# DataCard Component

A powerful card-based data display component that mirrors the functionality of DataTable but presents data in card format. Supports multiple layouts, custom styling, CRUD operations, filtering, search, pagination, and complete customization.

## Features

- **All DataTable Features**: Search, filters, pagination, CRUD operations, bulk actions
- **3 Built-in Card Variants**: `default`, `compact`, `detailed`
- **3 Layout Modes**: `grid`, `list`, `masonry`
- **Custom Card Rendering**: Pass your own styled card component
- **Responsive Grid**: Configurable columns per breakpoint
- **Selection Support**: Multi-select with bulk actions
- **Professional Animations**: Hover effects, transitions

## Basic Usage

```tsx
import { DataCard } from "@/ui/components/dataCard";

<DataCard
  cardTitle="All Products"
  data={products}
  fields={[
    { key: "name", label: "Name", isTitle: true },
    { key: "description", isSubtitle: true },
    { key: "status", label: "Status", isBadge: true },
    { key: "price", label: "Price" },
  ]}
  imageConfig={{
    src: "images",
    alt: "name",
    aspectRatio: "video",
  }}
  variant="default"
/>
```

## Props

### Main Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardTitle` | `string \| ((length: number) => string)` | - | Title for the card section |
| `data` | `TData[]` | - | Array of data items to display |
| `loading` | `boolean` | `false` | Loading state |
| `variant` | `'default' \| 'compact' \| 'detailed'` | `'default'` | Built-in card variant |
| `fields` | `CardFieldConfig[]` | - | Field configuration for built-in variants |
| `imageConfig` | `CardImageConfig` | - | Image/avatar configuration |
| `renderCard` | `(row, actions) => ReactNode` | - | Custom card render function |

### Layout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layoutConfig.layout` | `'grid' \| 'list' \| 'masonry'` | `'grid'` | Card layout mode |
| `layoutConfig.columns` | `{ default, sm?, md?, lg?, xl? }` | `{ default: 1, sm: 2, lg: 3, xl: 4 }` | Responsive columns |
| `layoutConfig.gap` | `'sm' \| 'md' \| 'lg'` | `'md'` | Gap between cards |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardClassName` | `string \| ((row) => string)` | - | Custom card class |
| `enableCardHover` | `boolean` | `true` | Enable hover effects |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'` | Border radius |
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Shadow level |

### Search & Filter Props

| Prop | Type | Description |
|------|------|-------------|
| `filterConfig` | `FilterConfig` | Filter configuration (same as DataTable). Search is a server-side `search` **text field placed first** here — `searchConfig` was removed. The card toolbar renders the inline `FilterBar` (not the panel-only `GlobalFilter`). |

### CRUD Operations

| Prop | Type | Description |
|------|------|-------------|
| `operations.formConfig` | `DynamicFormConfig` | Form configuration for add/edit |
| `operations.defaultValues` | `any` | Default form values |
| `operations.createMutation` | `UseMutationResult` | Create mutation hook |
| `operations.updateMutation` | `UseMutationResult` | Update mutation hook |
| `operations.deleteMutation` | `UseMutationResult` | Delete mutation hook |
| `operations.bulkDeleteMutation` | `UseMutationResult` | Bulk delete mutation hook |
| `operations.entityName` | `string` | Entity name for labels |
| `operations.isViewAvailable` | `boolean` | Show view action |

### Pagination Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultPageSize` | `number` | `12` | Items per page |
| `pageSizes` | `number[]` | `[12, 24, 48, 96]` | Page size options |

## Field Configuration

```tsx
interface CardFieldConfig<TData> {
  key: keyof TData | string;       // Data field key (supports nested: "user.name")
  label?: string;                  // Display label
  render?: (value, row) => ReactNode; // Custom render function
  isTitle?: boolean;               // Show as card title
  isSubtitle?: boolean;            // Show as subtitle
  isBadge?: boolean;               // Render as badge
  badgeVariant?: (value) => BadgeVariant; // Dynamic badge variant
  inFooter?: boolean;              // Show in card footer
  hidden?: boolean;                // Hide this field
  span?: 1 | 2;                    // Column span in body
}
```

## Image Configuration

```tsx
interface CardImageConfig<TData> {
  src: keyof TData | ((row) => string);  // Image source field or function
  alt?: keyof TData | string;            // Alt text
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait';
  fallback?: ReactNode | ((row) => ReactNode);
  asAvatar?: boolean;                     // Show as avatar (circular)
  position?: 'top' | 'left' | 'right' | 'background';
}
```

## Card Variants

### Default
Standard card with image on top, header with title/subtitle, body fields in grid, and footer.

### Compact
Horizontal card with avatar, title, subtitle, and badge. Great for list views.

### Detailed
Rich card with gradient header image, overlay actions, and structured body with separator lines.

## Custom Card Rendering

For complete control over card styling:

```tsx
<DataCard
  data={products}
  renderCard={(product, { onEdit, onView, onDelete }) => (
    <div className="my-custom-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="actions">
        <button onClick={onView}>View</button>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  )}
/>
```

## Full Example (Brands Page)

```tsx
import { DataCard } from "@/ui/components/dataCard";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/services/api";

export default function BrandsCardView() {
  const { data, isLoading } = useBrands();

  return (
    <DataCard
      cardTitle={(length) => `All Brands (${length})`}
      data={data?.items || []}
      loading={isLoading}
      variant="default"
      layoutConfig={{
        layout: "grid",
        columns: { default: 1, sm: 2, lg: 3, xl: 4 },
        gap: "md",
      }}
      fields={[
        { key: "name", isTitle: true },
        { key: "description", isSubtitle: true },
        { key: "status", isBadge: true, badgeVariant: (v) => v === "active" ? "default" : "secondary" },
        { key: "productCount", label: "Products", inFooter: true },
      ]}
      imageConfig={{
        src: "images",
        alt: "name",
        aspectRatio: "video",
      }}
      filterConfig={brandFilterConfig}
      selectable={true}
      enableCardHover={true}
      defaultPageSize={12}
      pageSizes={[12, 24, 48]}
      operations={{
        formConfig: brandFormConfig,
        defaultValues: { name: "", status: "active" },
        createMutation: useCreateBrand(),
        updateMutation: useUpdateBrand(),
        deleteMutation: useDeleteBrand(),
        entityName: "Brand",
        isViewAvailable: true,
      }}
    />
  );
}
```

## Comparison with DataTable

| Feature | DataTable | DataCard |
|---------|-----------|----------|
| Data display | Table rows | Cards |
| Layouts | Table only | Grid, List, Masonry |
| Custom UI | Row className | Full card customization |
| Sorting | Column sorting | N/A (use filters) |
| Column visibility | Yes | N/A |
| All CRUD features | Yes | Yes |
| Search & Filters | Yes | Yes |
| Pagination | Yes | Yes |
| Selection | Row selection | Card selection |
| Responsive | Horizontal scroll | Grid reflow |

## File Structure

```
ui/components/dataCard/
├── index.tsx           # Main DataCard component (with CRUD)
├── base-data-card.tsx  # Base component (without CRUD)
├── card-variants.tsx   # Card variant components (Default, Compact, Detailed)
├── toolbar.tsx         # Toolbar with search, filters, layout switcher
├── pagination.tsx      # Pagination component
└── datacard-doc.md     # This documentation
```

## Types

All types are exported from `@/types/DataCard.ts`:

```tsx
import type {
  DataCardProps,
  BaseDataCardProps,
  CardFieldConfig,
  CardImageConfig,
  CardCustomAction,
  DataCardAction,
  DataCardPagination,
  DataCardSearchConfig,
  CardLayout,
  CardVariant,
  CardSize,
  CardLayoutConfig,
} from "@/types/DataCard";
```
