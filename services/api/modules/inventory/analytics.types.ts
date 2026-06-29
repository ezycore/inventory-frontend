// coding-standard: maintained

/** Shared in/out + reason rollup returned by both analytics endpoints. */
export interface MovementSummary {
  stockIn: { count: number; quantity: number }
  stockOut: { count: number; quantity: number }
  netChange: number
  reasonBreakdown: { reason: string; count: number; quantity: number }[]
}

/** One stock-movement row (inventory-detail recent activity). */
export interface StockMovementRow {
  _id: string
  createdAt: string
  movementType: 'in' | 'out'
  reason: string
  quantity: number
  previousQuantity: number
  newQuantity: number
  notes?: string
  createdBy?: { name?: string; email?: string } | null
}

/** Per-location stock row for a product (product-detail stock breakdown). */
export interface ProductStockByLocation {
  locationId: string | null
  locationName: string
  quantity: number
  quantityAlert: number
  costPrice: number
  value: number
  isLowStock: boolean
  status: string
}

/** Per-variant performance rollup (variable products). */
export interface ProductVariantBreakdown {
  variantId: string
  name: string
  attributes: Record<string, unknown>
  price: number
  quantity: number
  stockValue: number
  costPrice: number
  unitsSold: number
  revenue: number
  grossProfit: number
  stockIn: number
  stockOut: number
  netChange: number
}

/** Response of GET /inventory/analytics/product/:productId. */
export interface ProductAnalytics {
  stock: {
    totalQuantity: number
    stockValue: number
    locationCount: number
    lowStockLocations: number
    byLocation: ProductStockByLocation[]
  }
  sales: {
    unitsSold: number
    revenue: number
    cogs: number
    grossProfit: number
    margin: number
    orderCount: number
  }
  movement: MovementSummary
  trend: { date: string; in: number; out: number }[]
  /** Per-variant performance (empty for single products). */
  byVariant: ProductVariantBreakdown[]
}

/** Response of GET /inventory/analytics/item/:inventoryId. */
export interface InventoryAnalytics {
  inventory: {
    _id: string
    quantity: number
    quantityAlert: number
    isLowStock: boolean
    status: string
    restockStatus: string
    costPrice: number
    stockValue: number
    updatedAt: string
  }
  product: {
    _id: string
    name: string
    barcode: string
    image: string | null
    unit: { name?: string; shortName?: string } | null
  } | null
  variant: { _id: string; attributes?: Record<string, unknown> } | null
  location: { _id: string; name: string } | null
  movement: MovementSummary
  balanceTrend: { date: string; balance: number }[]
  recentMovements: StockMovementRow[]
  /** Total movements for this inventory (drives the "View all" link when > shown). */
  movementTotal: number
  batches: BatchRow[] | null
  /** Org IANA timezone — render all dates on this page in it. */
  timezone: string
}

/** Per-batch breakdown row (expiry tracking). */
export interface BatchRow {
  _id: string
  batchNumber?: string
  remainingQuantity: number
  expiryDate?: string | null
  costPrice?: number
}
