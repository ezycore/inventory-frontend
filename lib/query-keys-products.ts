/**
 * Centralized query key factory for TanStack Query
 * Provides type-safe and consistent query keys across the application
 */

export const queryKeys = {
  organization: {
    get: () => ["organization"] as const,
    update: () => [...queryKeys.organization.get(), "update"] as const,
    delete: () => [...queryKeys.organization.get(), "delete"] as const,
    updateFormSettings: () =>
      [...queryKeys.organization.get(), "form-settings"] as const,
  },

  // Inventory query keys (legacy support)
  inventory: {
    all: () => ["inventory"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.inventory.all(), "list", filters] as const,
    detail: (id: string) =>
      [...queryKeys.inventory.all(), "detail", id] as const,
    search: (query: string) =>
      [...queryKeys.inventory.all(), "search", query] as const,
    lowStock: () => [...queryKeys.inventory.all(), "low-stock"] as const,
  },

  // Products query keys
  products: {
    all: () => ["products"] as const,
    list: () => [...queryKeys.products.all(), "list"] as const,
    detail: (id: string) =>
      [...queryKeys.products.all(), "detail", id] as const,
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
    list: (filters: Record<string, any>) =>
      [...queryKeys.variants.all(), "list", filters] as const,
    filtered: (filters?: Record<string, any>) =>
      [...queryKeys.variants.all(), "list", filters || {}] as const,
    detail: (id: string) =>
      [...queryKeys.variants.all(), "detail", id] as const,
    byProduct: (productId: string) =>
      [...queryKeys.variants.all(), "product", productId] as const,
    lowStock: () => [...queryKeys.variants.all(), "low-stock"] as const,
  },

  // Stock Management query keys
  stock: {
    all: () => ["stock"] as const,
    movements: (filters: Record<string, any>) =>
      [...queryKeys.stock.all(), "movements", filters] as const,
    movementsByVariant: (variantId: string) =>
      [...queryKeys.stock.all(), "movements", "variant", variantId] as const,
    levels: () => [...queryKeys.stock.all(), "levels"] as const,
  },

  // Stock Movements query keys (alias for compatibility)
  stockMovements: {
    all: () => ["stock", "movements"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.stockMovements.all(), "list", filters] as const,
    byVariant: (variantId?: string) =>
      [...queryKeys.stockMovements.all(), "variant", variantId] as const,
    detail: (id: string) =>
      [...queryKeys.stockMovements.all(), "detail", id] as const,
  },

  // Categories query keys
  category: {
    all: () => ["categories"] as const,
    list: () => [...queryKeys.category.all(), "list"] as const,
    detail: (id: string) =>
      [...queryKeys.category.all(), "detail", id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.category.all(), "slug", slug] as const,
  },

  // Units query keys
  units: {
    all: () => ["units"] as const,
    list: () => [...queryKeys.units.all(), "list"] as const,
    detail: (id: string) => [...queryKeys.units.all(), "detail", id] as const,
  },

  // Taxes query keys
  taxes: {
    all: () => ["taxes"] as const,
    list: () => [...queryKeys.taxes.all(), "list"] as const,
    detail: (id: string) => [...queryKeys.taxes.all(), "detail", id] as const,
  },

  // Discounts query keys
  discounts: {
    all: () => ["discounts"] as const,
    list: () => [...queryKeys.discounts.all(), "list"] as const,
    detail: (id: string) =>
      [...queryKeys.discounts.all(), "detail", id] as const,
  },

  // Brands query keys
  brands: {
    all: () => ["brands"] as const,
    list: () => [...queryKeys.brands.all(), "list"] as const,
    detail: (id: string) => [...queryKeys.brands.all(), "detail", id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.brands.all(), "slug", slug] as const,
  },

  // Variant Attributes query keys
  variantAttributes: {
    all: () => ["variantAttributes"] as const,
    list: () => [...queryKeys.variantAttributes.all(), "list"] as const,
    detail: (id: string) =>
      [...queryKeys.variantAttributes.all(), "detail", id] as const,
  },

  // Suppliers query keys
  supplier: {
    all: () => ["suppliers"] as const,
    list: () => [...queryKeys.supplier.all(), "list"] as const,
    detail: (id: string) =>
      [...queryKeys.supplier.all(), "detail", id] as const,
  },

  // Users query keys
  users: {
    all: () => ["users"] as const,
    list: () => [...queryKeys.users.all(), "list"] as const,
    detail: (id: string) => [...queryKeys.users.all(), "detail", id] as const,
  },

  // Dashboard query keys
  dashboard: {
    all: () => ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all(), "stats"] as const,
  },

  // Accounts query keys
  accounts: {
    all: () => ["accounts"] as const,
    list: () => [...queryKeys.accounts.all(), "list"] as const,
    detail: (id: string) =>
      [...queryKeys.accounts.all(), "detail", id] as const,
    default: () => [...queryKeys.accounts.all(), "default"] as const,
    summary: () => [...queryKeys.accounts.all(), "summary"] as const,
  },

  // Transactions query keys
  transactions: {
    all: () => ["transactions"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.transactions.all(), "list", filters || {}] as const,
    detail: (id: string) =>
      [...queryKeys.transactions.all(), "detail", id] as const,
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
