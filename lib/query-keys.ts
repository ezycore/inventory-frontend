export const queryKeys = {
  // Products
  products: {
    all: () => ['products'] as const,
    list: (filters?: any) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    bySlug: (slug: string) => ['products', 'slug', slug] as const,
    search: (query: string) => ['products', 'search', query] as const,
    withVariants: (id: string) => ['products', 'with-variants', id] as const,
  },

  // Variants
  variants: {
    all: () => ['variants'] as const,
    list: (filters?: any) => ['variants', 'list', filters] as const,
    detail: (id: string) => ['variants', 'detail', id] as const,
    byProduct: (productId: string) => ['variants', 'by-product', productId] as const,
    lowStock: () => ['variants', 'low-stock'] as const,
  },

  // Categories
  categories: {
    all: () => ['categories'] as const,
    list: (filters?: any) => ['categories', 'list', filters] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    bySlug: (slug: string) => ['categories', 'slug', slug] as const,
  },

  // Brands
  brands: {
    all: () => ['brands'] as const,
    list: (filters?: any) => ['brands', 'list', filters] as const,
    detail: (id: string) => ['brands', 'detail', id] as const,
    bySlug: (slug: string) => ['brands', 'slug', slug] as const,
  },

  // Stores
  stores: {
    all: () => ['stores'] as const,
    list: (filters?: any) => ['stores', 'list', filters] as const,
    detail: (id: string) => ['stores', 'detail', id] as const,
  },

  // Warehouses
  warehouses: {
    all: () => ['warehouses'] as const,
    list: (filters?: any) => ['warehouses', 'list', filters] as const,
    detail: (id: string) => ['warehouses', 'detail', id] as const,
  },

  // Customers (Sales)
  customers: {
    all: () => ['customers'] as const,
    list: (filters?: any) => ['customers', 'list', filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },

  // Suppliers (Purchases)
  suppliers: {
    all: () => ['suppliers'] as const,
    list: (filters?: any) => ['suppliers', 'list', filters] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },

  // Stock
  stock: {
    all: () => ['stock'] as const,
    movements: (filters?: any) => ['stock', 'movements', filters] as const,
    movementsByVariant: (variantId: string) => ['stock', 'movements-by-variant', variantId] as const,
    levels: () => ['stock', 'levels'] as const,
  },

  // Legacy support for existing usage patterns
  inventory: {
    all: () => ['inventory'] as const,
    detail: (id: string) => ['inventory', 'detail', id] as const,
    search: (query: string) => ['inventory', 'search', query] as const,
    lowStock: () => ['inventory', 'low-stock'] as const,
  },

  supplier: {
    all: () => ['supplier'] as const,
    detail: (id: string) => ['supplier', 'detail', id] as const,
  },

  category: {
    all: () => ['category'] as const,
  }
};