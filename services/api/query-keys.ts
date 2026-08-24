// coding-standard: maintained
/**
 * Single source of truth for every TanStack Query key in the application.
 *
 * The invariant that makes invalidation work: **every key a resource owns starts with that
 * resource's `all()`**. So `invalidateQueries({ queryKey: queryKeys.brands.all() })` is always a
 * complete flush of everything brand-shaped — its lists, its details, its stats, and the `<select>`
 * options behind every form that lists brands — without the caller knowing what those keys look like.
 *
 * **Never inline a key array anywhere else.** A literal that merely *happens* to match a root works
 * right up until someone renames the root, and then fails silently.
 * See `docs/plan/query-invalidation.md` for the defects that motivated this file.
 */

/** A list's filter/param payload. Opaque by design: it is hashed into the key, never read back. */
type Params = unknown;

/**
 * The key shape every resource shares. Spread it, then add that resource's own extras:
 *
 * ```ts
 * products: { ...resourceKeys("products"), bySlug: (slug: string) => [...] as const }
 * ```
 *
 * `options` is the dropdown cache (`useSelectOptions`). The URL only disambiguates projections of
 * the same data — it is the **root** that makes a mutation refresh every dropdown listing that
 * resource, which is why a dropdown key must never live outside its resource.
 */
const resourceKeys = <R extends string>(root: R) =>
  ({
    all: () => [root] as const,
    lists: () => [root, "list"] as const,
    list: (params?: Params) => [root, "list", params ?? {}] as const,
    details: () => [root, "detail"] as const,
    detail: (id: string) => [root, "detail", id] as const,
    options: (url: string) => [root, "options", url] as const,
    stats: (params?: Params) => [root, "stats", params ?? {}] as const,
    summary: (params?: Params) => [root, "summary", params ?? {}] as const,
  }) as const;

export const queryKeys = {
  // ── Organization (a singleton, not a CRUD resource) ──────────────────────────
  organization: {
    all: () => ["organization"] as const,
    features: () => ["organization", "features"] as const,
    featureImpact: () => ["organization", "features", "impact"] as const,
    subscription: () => ["organization", "subscription"] as const,
    plans: () => ["organization", "plans"] as const,
    storefront: () => ["organization", "storefront"] as const,
    // Under the `storefront` prefix deliberately: a settings save is exactly the
    // moment the merchant is about to look at the preview again, and a re-mint is
    // one cheap request against a stale token in an iframe URL.
    storefrontPreview: () =>
      ["organization", "storefront", "preview-token"] as const,
    notifications: () => ["organization", "notifications"] as const,
    notificationLog: (params?: object) =>
      ["organization", "notifications", "log", params ?? {}] as const,
    // Under the `notifications` prefix on purpose: sending an SMS moves the
    // balance, the log AND this roll-up, and one invalidation must flush all
    // three or the usage figure quietly disagrees with the balance beside it.
    smsUsage: (months?: number) =>
      ["organization", "notifications", "sms-usage", months ?? null] as const,
  },

  profile: {
    all: () => ["profile"] as const,
    twoFactorStatus: () => ["profile", "2fa-status"] as const,
  },

  // ── Catalog ─────────────────────────────────────────────────────────────────
  products: {
    ...resourceKeys("products"),
    bySlug: (slug: string) => ["products", "slug", slug] as const,
  },

  categories: {
    ...resourceKeys("categories"),
    bySlug: (slug: string) => ["categories", "slug", slug] as const,
    /** The two-level tree with per-node product counts (`GET /categories/tree`). */
    tree: () => ["categories", "tree"] as const,
  },

  brands: {
    ...resourceKeys("brands"),
    bySlug: (slug: string) => ["brands", "slug", slug] as const,
  },

  tags: {
    ...resourceKeys("tags"),
    bySlug: (slug: string) => ["tags", "slug", slug] as const,
  },

  units: resourceKeys("units"),
  taxes: resourceKeys("taxes"),
  discounts: resourceKeys("discounts"),

  variants: {
    ...resourceKeys("variants"),
    byProduct: (productId: string) => ["variants", "product", productId] as const,
  },

  variantAttributes: resourceKeys("variantAttributes"),

  barcode: {
    all: () => ["barcode"] as const,
    lookup: (code: string) => ["barcode", "lookup", code] as const,
  },

  // ── Inventory & stock ───────────────────────────────────────────────────────
  inventory: {
    ...resourceKeys("inventory"),
    lowStock: () => ["inventory", "low-stock"] as const,
    shortlist: (params?: Params) => ["inventory", "shortlist", params ?? {}] as const,
    byProduct: (productId: string) => ["inventory", "product", productId] as const,
    scopeOptions: () => ["inventory", "scope-options"] as const,
    productAnalytics: (productId: string, variantId?: string) =>
      ["inventory", "analytics", "product", productId, variantId ?? null] as const,
    itemAnalytics: (inventoryId: string) =>
      ["inventory", "analytics", "item", inventoryId] as const,
    expiring: (params?: Params) => ["inventory", "expiring", params ?? {}] as const,
    expired: (params?: Params) => ["inventory", "expired", params ?? {}] as const,
    productBatches: (productId: string, params?: Params) =>
      ["inventory", "product-batches", productId, params ?? {}] as const,
  },

  stock: {
    all: () => ["stock"] as const,
    levels: () => ["stock", "levels"] as const,
  },

  /** Stock movements live *under* `stock`, so flushing `stock.all()` flushes them too. */
  stockMovements: {
    all: () => ["stock", "movements"] as const,
    lists: () => ["stock", "movements", "list"] as const,
    list: (params?: Params) => ["stock", "movements", "list", params ?? {}] as const,
    details: () => ["stock", "movements", "detail"] as const,
    detail: (id: string) => ["stock", "movements", "detail", id] as const,
    stats: (params?: Params) => ["stock", "movements", "stats", params ?? {}] as const,
    inventoryHistory: (productId: string, locationId: string, variantId?: string) =>
      ["stock", "movements", "inventory", productId, locationId, variantId ?? null] as const,
  },

  // ── Sales ───────────────────────────────────────────────────────────────────
  salesOrders: {
    ...resourceKeys("sales-orders"),
    payments: (id: string) => ["sales-orders", "detail", id, "payments"] as const,
    transactions: (id: string) => ["sales-orders", "detail", id, "transactions"] as const,
  },

  salesReturns: {
    ...resourceKeys("sales-returns"),
    bySale: (saleId: string) => ["sales-returns", "sale", saleId] as const,
    customerDues: (customerId: string, excludeSaleId?: string) =>
      ["sales-returns", "customer-dues", customerId, excludeSaleId ?? null] as const,
  },

  // ── Purchases ───────────────────────────────────────────────────────────────
  purchaseOrders: {
    ...resourceKeys("purchase-orders"),
    payments: (id: string) => ["purchase-orders", "detail", id, "payments"] as const,
    transactions: (id: string) => ["purchase-orders", "detail", id, "transactions"] as const,
  },

  purchaseReturns: {
    ...resourceKeys("purchase-returns"),
    byPurchaseOrder: (purchaseOrderId: string) =>
      ["purchase-returns", "purchase-order", purchaseOrderId] as const,
    supplierDues: (supplierId: string, excludePurchaseOrderId?: string) =>
      [
        "purchase-returns",
        "supplier-dues",
        supplierId,
        excludePurchaseOrderId ?? null,
      ] as const,
  },

  // ── Parties ─────────────────────────────────────────────────────────────────
  customers: {
    ...resourceKeys("customers"),
    ledger: (customerId: string, params?: Params) =>
      ["customers", "ledger", customerId, params ?? {}] as const,
    statement: (customerId: string, params?: Params) =>
      ["customers", "statement", customerId, params ?? {}] as const,
    /** Open invoices behind the "Receive Payment" allocation table. */
    outstanding: (customerId: string) =>
      ["customers", "outstanding", customerId] as const,
    /**
     * Org-wide receivable / credit totals, served on the customer list response.
     * Starts with "customers" like every other key here, so one
     * `invalidateQueries({ queryKey: queryKeys.customers.all() })` still flushes it.
     */
    totals: () => ["customers", "totals"] as const,
  },

  suppliers: {
    ...resourceKeys("suppliers"),
    ledger: (supplierId: string, params?: Params) =>
      ["suppliers", "ledger", supplierId, params ?? {}] as const,
    statement: (supplierId: string, params?: Params) =>
      ["suppliers", "statement", supplierId, params ?? {}] as const,
  },

  // ── Money ───────────────────────────────────────────────────────────────────
  accounts: {
    ...resourceKeys("accounts"),
    default: () => ["accounts", "default"] as const,
    /** The lean account list behind order/payment pickers (`use-order-account-options`). */
    orderOptions: () => ["accounts", "order-options"] as const,
  },

  transactions: {
    ...resourceKeys("transactions"),
    byAccount: (accountId: string, params?: Params) =>
      ["transactions", "account", accountId, params ?? {}] as const,
  },

  // ── Org structure ───────────────────────────────────────────────────────────
  locations: {
    ...resourceKeys("locations"),
    /** The lean location list behind the storefront settings picker. */
    storefrontOptions: () => ["locations", "storefront-options"] as const,
  },

  users: {
    ...resourceKeys("users"),
    me: () => ["users", "me"] as const,
    myLocations: () => ["users", "me", "locations"] as const,
  },

  roles: {
    ...resourceKeys("roles"),
    /** The plan-filtered permission tree the role builder renders. */
    catalog: () => ["roles", "catalog"] as const,
    /** Holder count for one role, read before offering to delete it. */
    usage: (slug: string) => ["roles", "usage", slug] as const,
  },

  // ── Read models ─────────────────────────────────────────────────────────────
  dashboard: {
    all: () => ["dashboard"] as const,
    stats: () => ["dashboard", "stats"] as const,
    overview: (params?: Params) => ["dashboard", "overview", params ?? {}] as const,
  },

  reports: {
    all: () => ["reports"] as const,
    inventory: (params?: Params) => ["reports", "inventory", params ?? {}] as const,
    sales: (params?: Params) => ["reports", "sales", params ?? {}] as const,
    combos: (params?: Params) => ["reports", "combos", params ?? {}] as const,
    purchases: (params?: Params) => ["reports", "purchases", params ?? {}] as const,
    cash: (params?: Params) => ["reports", "cash", params ?? {}] as const,
    capital: (params?: Params) => ["reports", "capital", params ?? {}] as const,
    profitLoss: (params?: Params) => ["reports", "profit-loss", params ?? {}] as const,
    position: () => ["reports", "position"] as const,
    tax: (params?: Params) => ["reports", "tax", params ?? {}] as const,
    taxLedger: (params?: Params, page = 1, limit = 20) =>
      ["reports", "tax-ledger", params ?? {}, page, limit] as const,
    valuation: () => ["reports", "valuation"] as const,
    employees: (params?: Params) => ["reports", "employees", params ?? {}] as const,
    export: (dataType: string, params?: Params) =>
      ["reports", "export", dataType, params ?? {}] as const,
  },

  locationStockReport: {
    all: () => ["location-stock-report"] as const,
    summary: () => ["location-stock-report", "summary"] as const,
    detail: (locationId: string, params?: Params) =>
      ["location-stock-report", "detail", locationId, params ?? {}] as const,
    comparison: () => ["location-stock-report", "comparison"] as const,
  },

  // ── Ecommerce / storefront (admin side) ─────────────────────────────────────
  storefrontOrders: {
    ...resourceKeys("storefront-orders"),
    /**
     * The create dialog's live price, keyed on the whole draft — every field in it
     * (lines, coupon, discount, zone, shipping override) changes the answer, so
     * the draft IS the key. Under the orders root so a campaign or coupon change
     * that dirties orders drops the stale price too.
     */
    quote: (draft: Params) => ["storefront-orders", "quote", draft] as const,
    /**
     * The create dialog's picker rows — storefront-priced, campaign-applied.
     * Under the orders root so a campaign or catalog change that dirties orders
     * refreshes the prices the merchant is about to quote.
     */
    products: () => ["storefront-orders", "products"] as const,
  },

  /** Courier provider config — a sibling of orders, not a part of them. */
  couriers: {
    ...resourceKeys("storefront-couriers"),
    webhook: () => ["storefront-couriers", "webhook"] as const,
  },

  storefrontCatalog: {
    ...resourceKeys("storefront-catalog"),
    collections: () => ["storefront-catalog", "collections"] as const,
    /** Per-variant storefront pricing rows for one product (the listing editor). */
    variants: (id: string) => ["storefront-catalog", "variants", id] as const,
  },

  storefrontCustomers: {
    ...resourceKeys("ecommerce-customers"),
    orders: (id: string, page: number, limit: number) =>
      ["ecommerce-customers", "detail", id, "orders", page, limit] as const,
    /**
     * Footer sign-ups. Under this resource's root on purpose — they are read on
     * the same screen and written only by shoppers, so nothing here ever needs
     * its own invalidation and one `all()` flush still covers the whole page.
     */
    subscribers: (params?: Params) =>
      ["ecommerce-customers", "subscribers", params ?? {}] as const,
  },

  storefrontDashboard: {
    all: () => ["ecommerce-dashboard"] as const,
  },

  /**
   * Abandoned carts + the purchase funnel. Read-only resource — carts are written
   * by shoppers on the storefront, so no admin mutation ever invalidates these;
   * they refresh on the global staleTime.
   */
  storefrontCarts: {
    all: () => ["ecommerce-carts"] as const,
    list: (params?: Params) => ["ecommerce-carts", "list", params ?? {}] as const,
    stats: (days?: number) => ["ecommerce-carts", "stats", days ?? null] as const,
  },

  campaigns: resourceKeys("campaigns"),
  coupons: resourceKeys("coupons"),
  contentPages: resourceKeys("content-pages"),
  domains: resourceKeys("domains"),
  // Read-only Mission Control access to this workspace. No mutation of ours
  // creates one — only MC can — so nothing else invalidates this root.
  supportSessions: resourceKeys("supportSessions"),
} as const;
