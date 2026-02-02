/**
 * Centralized query key factory for TanStack Query
 * Provides type-safe and consistent query keys across the application
 */

export const queryKeys = {
  organization: {
    get: () => ["organization"] as const, //in use
    update: () => [...queryKeys.organization.get(), "update"] as const,
    delete: () => [...queryKeys.organization.get(), "delete"] as const,
    updateFormSettings: () =>
      [...queryKeys.organization.get(), "form-settings"] as const,
    features: () => [...queryKeys.organization.get(), "features"] as const,
  },

  // Inventory query keys
  inventory: {
    all: () => ["inventory"] as const,
    lists: () => [...queryKeys.inventory.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.inventory.lists(), filters || {}] as const,
    details: () => [...queryKeys.inventory.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.inventory.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.inventory.all(), "search", query] as const,
    lowStock: () => [...queryKeys.inventory.all(), "low-stock"] as const,
  },

  // Products query keys
  products: {
    all: () => ["products"] as const,
    lists: () => [...queryKeys.products.all(), "list"] as const,
    list: () => [...queryKeys.products.lists()] as const,
    details: () => [...queryKeys.products.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.products.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.products.all(), "slug", slug] as const,
    search: (query: string) =>
      [...queryKeys.products.all(), "search", query] as const,
    withVariants: (id: string) =>
      [...queryKeys.products.detail(id), "variants"] as const,
  },

  // Variants query keys
  variants: {
    all: () => ["variants"] as const,
    lists: () => [...queryKeys.variants.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.variants.lists(), filters || {}] as const,
    filtered: (filters?: Record<string, any>) =>
      [...queryKeys.variants.lists(), filters || {}] as const,
    details: () => [...queryKeys.variants.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.variants.details(), id] as const,
    byProduct: (productId: string) =>
      [...queryKeys.variants.all(), "product", productId] as const,
    lowStock: () => [...queryKeys.variants.all(), "low-stock"] as const,
  },

  // Stock Management query keys
  stock: {
    all: () => ["stock"] as const,
    movements: (filters?: Record<string, any>) =>
      [...queryKeys.stock.all(), "movements", filters || {}] as const,
    movementsByVariant: (variantId: string) =>
      [...queryKeys.stock.all(), "movements", "variant", variantId] as const,
    levels: () => [...queryKeys.stock.all(), "levels"] as const,
  },

  // Stock Movements query keys (alias for compatibility)
  stockMovements: {
    all: () => ["stock", "movements"] as const,
    lists: () => [...queryKeys.stockMovements.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.stockMovements.lists(), filters || {}] as const,
    byVariant: (variantId?: string) =>
      [...queryKeys.stockMovements.all(), "variant", variantId] as const,
    details: () => [...queryKeys.stockMovements.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.stockMovements.details(), id] as const,
    inventoryHistory: (productId: string, locationId: string, variantId?: string) =>
      [...queryKeys.stockMovements.all(), "inventory", productId, locationId, variantId] as const,
  },

  // Purchase Orders query keys
  purchaseOrders: {
    all: () => ["purchase-orders"] as const,
    lists: () => [...queryKeys.purchaseOrders.all(), "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.purchaseOrders.lists(), filters || {}] as const,
    details: () => [...queryKeys.purchaseOrders.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.purchaseOrders.details(), id] as const,
  },

  // Sales Orders query keys
  salesOrders: {
    all: () => ["sales-orders"] as const,
    lists: () => [...queryKeys.salesOrders.all(), "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.salesOrders.lists(), filters || {}] as const,
    details: () => [...queryKeys.salesOrders.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.salesOrders.details(), id] as const,
  },

  // Categories query keys
  categories: {
    all: () => ["categories"] as const,
    lists: () => [...queryKeys.categories.all(), "list"] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.categories.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.categories.all(), "slug", slug] as const,
  },

  // Units query keys
  units: {
    all: () => ["units"] as const,
    lists: () => [...queryKeys.units.all(), "list"] as const,
    list: () => [...queryKeys.units.lists()] as const,
    details: () => [...queryKeys.units.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.units.details(), id] as const,
  },

  // Taxes query keys
  taxes: {
    all: () => ["taxes"] as const,
    lists: () => [...queryKeys.taxes.all(), "list"] as const,
    list: () => [...queryKeys.taxes.lists()] as const,
    details: () => [...queryKeys.taxes.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.taxes.details(), id] as const,
  },

  // Discounts query keys
  discounts: {
    all: () => ["discounts"] as const,
    lists: () => [...queryKeys.discounts.all(), "list"] as const,
    list: () => [...queryKeys.discounts.lists()] as const,
    details: () => [...queryKeys.discounts.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.discounts.details(), id] as const,
  },

  // Brands query keys
  brands: {
    all: () => ["brands"] as const,
    lists: () => [...queryKeys.brands.all(), "list"] as const,
    list: () => [...queryKeys.brands.lists()] as const,
    details: () => [...queryKeys.brands.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.brands.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.brands.all(), "slug", slug] as const,
  },

  // Locations query keys
  locations: {
    all: () => ["locations"] as const,
    lists: () => [...queryKeys.locations.all(), "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.locations.lists(), filters || {}] as const,
    details: () => [...queryKeys.locations.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.locations.details(), id] as const,
  },

  // Customers query keys
  customers: {
    all: () => ["customers"] as const,
    lists: () => [...queryKeys.customers.all(), "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.customers.lists(), filters || {}] as const,
    details: () => [...queryKeys.customers.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },

  // Variant Attributes query keys
  variantAttributes: {
    all: () => ["variantAttributes"] as const,
    lists: () => [...queryKeys.variantAttributes.all(), "list"] as const,
    list: () => [...queryKeys.variantAttributes.lists()] as const,
    details: () => [...queryKeys.variantAttributes.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.variantAttributes.details(), id] as const,
  },

  // Suppliers query keys
  suppliers: {
    all: () => ["suppliers"] as const,
    lists: () => [...queryKeys.suppliers.all(), "list"] as const,
    list: () => [...queryKeys.suppliers.lists()] as const,
    details: () => [...queryKeys.suppliers.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.suppliers.details(), id] as const,
  },

  // Users query keys
  users: {
    all: () => ["users"] as const,
    lists: () => [...queryKeys.users.all(), "list"] as const,
    list: () => [...queryKeys.users.lists()] as const,
    details: () => [...queryKeys.users.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Dashboard query keys
  dashboard: {
    all: () => ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all(), "stats"] as const,
  },

  // Accounts query keys
  accounts: {
    all: () => ["accounts"] as const,
    lists: () => [...queryKeys.accounts.all(), "list"] as const,
    list: () => [...queryKeys.accounts.lists()] as const,
    details: () => [...queryKeys.accounts.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.accounts.details(), id] as const,
    default: () => [...queryKeys.accounts.all(), "default"] as const,
    summary: () => [...queryKeys.accounts.all(), "summary"] as const,
  },

  // Transactions query keys
  transactions: {
    all: () => ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.transactions.lists(), filters || {}] as const,
    details: () => [...queryKeys.transactions.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.transactions.details(), id] as const,
    byAccount: (accountId: string, filters?: Record<string, any>) =>
      [
        ...queryKeys.transactions.all(),
        "account",
        accountId,
        filters || {},
      ] as const,
    summary: (filters?: Record<string, any>) =>
      [...queryKeys.transactions.all(), "summary", filters || {}] as const,
  },
} as const;
