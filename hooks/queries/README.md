# Query Hooks Organization

This directory contains organized React Query hooks for the EasyStock Inventory Management application, structured by domain/module for better maintainability.

## Structure

```
hooks/queries/
├── index.ts                    # Central export file
├── helper.ts                   # Factory for creating CRUD hooks
├── use-auth.ts                 # Authentication queries
├── use-setup.ts                # Initial setup queries
├── use-profile.ts              # User profile queries & mutations
├── use-products.ts             # Product CRUD operations
├── use-product-variants.ts     # Product variant instances (SKU, price, stock)
├── use-variants.ts             # Variant attribute templates (Color, Size, etc.)
├── use-categories.ts           # Category CRUD operations
├── use-brands.ts               # Brand CRUD operations
├── use-locations.ts            # Location (stores/warehouses) CRUD
├── use-units.ts                # Unit of measure CRUD
├── use-taxes.ts                # Tax CRUD operations
├── use-customers.ts            # Customer CRUD (for sales)
├── use-suppliers.ts            # Supplier CRUD (for purchases)
├── use-users.ts                # User management queries
├── use-inventory.ts            # Inventory CRUD + bulk operations
├── use-stock-movements.ts      # Stock movements (audit trail) + mutations
├── use-dashboard.ts            # Dashboard statistics
└── use-select-options.ts       # Common select dropdown options
```

## Usage Examples

### Import Specific Hooks
```typescript
// Import from specific modules
import { useProducts, useProduct } from '@/hooks/queries/use-products'
import { useBrands, useBrand } from '@/hooks/queries/use-brands'
```

### Import from Index (Recommended)
```typescript
// Import multiple hooks from the main index
import { 
  useProducts, 
  useBrands,
  useCategories,
  useInventories
} from '@/hooks/queries'
```

## Key Hook Categories

### Product Management
- **use-products.ts**: Main product CRUD (name, description, category)
- **use-product-variants.ts**: Product variant instances with SKU, price, stock levels
- **use-variants.ts**: Variant attribute templates (e.g., "Color", "Size")

### Inventory & Stock
- **use-inventory.ts**: 
  - Inventory CRUD operations
  - Bulk operations: receive, sell, adjust
  - Stock returns (sales/purchases)
  - Stock transfers between locations
  
- **use-stock-movements.ts**:
  - Stock movement audit trail queries
  - Stock adjustment mutations
  - Stock transfer operations
  - Historical inventory tracking

### Master Data
- **use-categories.ts**: Product categories
- **use-brands.ts**: Product brands
- **use-locations.ts**: Stores & warehouses
- **use-units.ts**: Units of measure (pcs, kg, liters)
- **use-taxes.ts**: Tax configurations

### Business Partners
- **use-customers.ts**: Customer records for sales
- **use-suppliers.ts**: Supplier records for purchases

### User & System
- **use-auth.ts**: Login/logout operations
- **use-profile.ts**: User profile & preferences
- **use-users.ts**: User management & permissions
- **use-dashboard.ts**: Dashboard statistics & analytics

## Factory Pattern

Most CRUD hooks use the `createResourceHooks` factory from `helper.ts`:

```typescript
// Example: use-brands.ts
import { brandsApi } from '@/lib/api'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'

const brandHooks = createResourceHooks(brandsApi, queryKeys.brands)

export const useBrands = brandHooks.useList
export const useBrand = brandHooks.useDetail
export const useCreateBrand = brandHooks.useCreate
export const useUpdateBrand = brandHooks.useUpdate
export const useDeleteBrand = brandHooks.useDelete
```

This provides:
- ✅ Consistent API across all resources
- ✅ Automatic query invalidation
- ✅ Error handling with toast notifications
- ✅ Optimistic updates support
- ✅ Type safety

## Benefits of This Organization

1. **🗂️ Better Organization**: Each domain has its own file
2. **🔍 Easy Discovery**: Find hooks by their domain/feature
3. **📦 Code Reusability**: Factory pattern reduces boilerplate
4. **🚀 Type Safety**: Full TypeScript support
5. **👥 Team Collaboration**: Multiple developers can work on different modules
6. **🧪 Easier Testing**: Test hooks by domain
7. **📊 Better Performance**: Import only what you need

## Common Patterns

### List Query with Filters
```typescript
const { data, isLoading } = useProducts({ 
  page: 1, 
  limit: 10, 
  status: 'active' 
})
```

### Detail Query by ID
```typescript
const { data: product } = useProduct(productId)
```

### Create Mutation
```typescript
const createProduct = useCreateProduct()
await createProduct.mutateAsync(productData)
```

### Update Mutation
```typescript
const updateProduct = useUpdateProduct()
await updateProduct.mutateAsync({ id, ...data })
```

### Delete Mutation
```typescript
const deleteProduct = useDeleteProduct()
await deleteProduct.mutateAsync(productId)
```

## Hook Reusability

The factory pattern in `helper.ts` eliminates 90% of boilerplate code. Instead of manually writing query and mutation hooks for each resource, you simply:

1. Create an API client for your resource
2. Define query keys
3. Call `createResourceHooks()` 
4. Export the generated hooks

This ensures consistency across all CRUD operations and makes it easy to add new resources.
