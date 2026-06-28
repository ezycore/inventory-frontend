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
    subscription: () =>
      [...queryKeys.organization.get(), "subscription"] as const,
    plans: () => [...queryKeys.organization.get(), "plans"] as const,
  },

  // Inventory query keys
  inventory: {
    all: () => ["inventory"] as const,
    lists: () => [...queryKeys.inventory.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.inventory.lists(), filters || {}] as const,
    details: () => [...queryKeys.inventory.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.inventory.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.inventory.all(), "search", query] as const,
    lowStock: () => [...queryKeys.inventory.all(), "low-stock"] as const,
    productAnalytics: (productId: string, variantId?: string) =>
      [...queryKeys.inventory.all(), "analytics", "product", productId, variantId ?? null] as const,
    itemAnalytics: (inventoryId: string) =>
      [...queryKeys.inventory.all(), "analytics", "item", inventoryId] as const,
  },

  // Products query keys
  products: {
    all: () => ["products"] as const,
    lists: () => [...queryKeys.products.all(), "list"] as const,
    list: () => [...queryKeys.products.lists()] as const,
    details: () => [...queryKeys.products.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.products.all(), "slug", slug] as const,
    search: (query: string) =>
      [...queryKeys.products.all(), "search", query] as const,
    withVariants: (id: string) =>
      [...queryKeys.products.detail(id), "variants"] as const,
  },

  // Barcode lookup
  barcode: {
    all: () => ["barcode"] as const,
    lookup: (code: string) =>
      [...queryKeys.barcode.all(), "lookup", code] as const,
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
    detail: (id: string) => [...queryKeys.variants.details(), id] as const,
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
    inventoryHistory: (
      productId: string,
      locationId: string,
      variantId?: string,
    ) =>
      [
        ...queryKeys.stockMovements.all(),
        "inventory",
        productId,
        locationId,
        variantId,
      ] as const,
  },

  // Purchase Orders query keys
  purchaseOrders: {
    all: () => ["purchase-orders"] as const,
    lists: () => [...queryKeys.purchaseOrders.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.purchaseOrders.lists(), filters || {}] as const,
    details: () => [...queryKeys.purchaseOrders.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.purchaseOrders.details(), id] as const,
    summary: () => [...queryKeys.purchaseOrders.all(), "summary"] as const,
    payments: (id: string) =>
      [...queryKeys.purchaseOrders.all(), "payments", id] as const,
    transactions: (id: string) =>
      [...queryKeys.purchaseOrders.all(), "transactions", id] as const,
  },

  // Purchase Returns query keys
  purchaseReturns: {
    all: () => ["purchase-returns"] as const,
    lists: () => [...queryKeys.purchaseReturns.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.purchaseReturns.lists(), filters || {}] as const,
    details: () => [...queryKeys.purchaseReturns.all(), "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.purchaseReturns.details(), id] as const,
    byPurchaseOrder: (purchaseOrderId: string) =>
      [
        ...queryKeys.purchaseReturns.all(),
        "purchase-order",
        purchaseOrderId,
      ] as const,
    supplierDues: (supplierId: string, excludePurchaseOrderId?: string) =>
      [
        ...queryKeys.purchaseReturns.all(),
        "supplier-dues",
        supplierId,
        excludePurchaseOrderId,
      ] as const,
    summary: () => [...queryKeys.purchaseReturns.all(), "summary"] as const,
  },

  // Sales Orders query keys
  salesOrders: {
    all: () => ["sales-orders"] as const,
    lists: () => [...queryKeys.salesOrders.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.salesOrders.lists(), filters || {}] as const,
    details: () => [...queryKeys.salesOrders.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.salesOrders.details(), id] as const,
  },

  // Sales Returns query keys
  salesReturns: {
    all: () => ["sales-returns"] as const,
    lists: () => [...queryKeys.salesReturns.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.salesReturns.lists(), filters || {}] as const,
    details: () => [...queryKeys.salesReturns.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.salesReturns.details(), id] as const,
    bySale: (saleId: string) =>
      [...queryKeys.salesReturns.all(), "sale", saleId] as const,
    customerDues: (customerId: string, excludeSaleId?: string) =>
      [
        ...queryKeys.salesReturns.all(),
        "customer-dues",
        customerId,
        excludeSaleId,
      ] as const,
  },

  // Categories query keys
  categories: {
    all: () => ["categories"] as const,
    lists: () => [...queryKeys.categories.all(), "list"] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
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
    detail: (id: string) => [...queryKeys.discounts.details(), id] as const,
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
    list: (filters?: Record<string, any>) =>
      [...queryKeys.locations.lists(), filters || {}] as const,
    details: () => [...queryKeys.locations.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.locations.details(), id] as const,
  },

  // Customers query keys
  customers: {
    all: () => ["customers"] as const,
    lists: () => [...queryKeys.customers.all(), "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.customers.lists(), filters || {}] as const,
    details: () => [...queryKeys.customers.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    summary: () => [...queryKeys.customers.all(), "summary"] as const,
    ledger: (customerId: string, filters?: Record<string, any>) =>
      [
        ...queryKeys.customers.all(),
        "ledger",
        customerId,
        filters || {},
      ] as const,
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
    detail: (id: string) => [...queryKeys.suppliers.details(), id] as const,
    ledger: (supplierId: string, filters?: Record<string, any>) =>
      [
        ...queryKeys.suppliers.all(),
        "ledger",
        supplierId,
        filters || {},
      ] as const,
  },

  // Users query keys
  users: {
    all: () => ["users"] as const,
    lists: () => [...queryKeys.users.all(), "list"] as const,
    list: () => [...queryKeys.users.lists()] as const,
    details: () => [...queryKeys.users.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  roles: {
    all: () => ["roles"] as const,
  },

  // Dashboard query keys
  dashboard: {
    all: () => ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all(), "stats"] as const,
    overview: (params?: Record<string, any>) => [...queryKeys.dashboard.all(), "overview", params || {}] as const,
  },

  // Accounts query keys
  accounts: {
    all: () => ["accounts"] as const,
    lists: () => [...queryKeys.accounts.all(), "list"] as const,
    list: () => [...queryKeys.accounts.lists()] as const,
    details: () => [...queryKeys.accounts.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), id] as const,
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
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    byAccount: (accountId: string, filters?: Record<string, any>) =>
      [
        ...queryKeys.transactions.all(),
        "account",
        accountId,
        filters || {},
      ] as const,
    summary: (filters?: Record<string, any>) =>
      [...queryKeys.transactions.all(), "summary", filters || {}] as const,
    stats: (params?: Record<string, any>) =>
      [...queryKeys.transactions.all(), "stats", params || {}] as const,
  },
} as const;
