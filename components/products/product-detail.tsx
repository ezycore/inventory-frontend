'use client'

import { Badge } from '@ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Separator } from '@ui/components/separator'
import { Skeleton } from '@ui/components/skeleton'
import { Button } from '@ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/components/table'
import { Package, Tag, TrendingUp, DollarSign, BarChart3, MapPin, Clock, ShoppingCart, Truck, AlertCircle, ShieldCheck, Info, Layers } from 'lucide-react'
import { StatusBadge } from '@/ui/components/status-badge'
import { format } from 'date-fns'
import Image from 'next/image'
import { useProduct, inventoryApi, salesApi, purchaseOrdersApi, stockApi } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { useQuery } from '@tanstack/react-query'

interface InventoryItem {
  _id: string
  productId: string
  variantId?: string | null
  locationId: string
  quantity: number
  quantityAlert: number
  isLowStock: boolean
  location?: {
    _id: string
    name: string
  }
  variant?: {
    sku?: string
  }
  shelf?: string
}

interface ProductDetailProps {
  productId: string
  onClose?: () => void
}

export function ProductDetail({ productId, onClose }: ProductDetailProps) {
  const { data: product, isLoading, error } = useProduct(productId)
  const { format: formatCurrency, symbol } = useCurrency()

  // Fetch inventory for this product (stock by location)
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'product', productId],
    queryFn: () => inventoryApi.getAll({ productId }),
    enabled: !!productId,
    select: (data) => data.data,
  })

  // Fetch stock overview for stats
  const { data: stockOverview } = useQuery({
    queryKey: ['stock', 'overview', productId],
    queryFn: () => stockApi.getOverview(productId),
    enabled: !!productId,
    select: (data) => data.data,
  })

  // Fetch recent sales
  const { data: salesData } = useQuery({
    queryKey: ['sales', 'product', productId],
    queryFn: () => salesApi.getAll({ limit: 5 }),
    enabled: !!productId,
    select: (data) => data.data,
  })

  // Fetch recent purchases
  const { data: purchasesData } = useQuery({
    queryKey: ['purchases', 'product', productId],
    queryFn: () => purchaseOrdersApi.getAll({ limit: 5 }),
    enabled: !!productId,
    select: (data) => data.data,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        {onClose && <Button onClick={onClose}>Close</Button>}
      </div>
    )
  }

  const hasVariants = product.productType === 'variable' && product.variants && product.variants.length > 0

  // Compute inventory stats
  const inventoryItems: InventoryItem[] = inventoryData?.items || (inventoryData as any) || []
  const totalStock = product.totalStock ?? inventoryItems.reduce((sum: number, item: InventoryItem) => sum + (item.quantity || 0), 0)
  const locationCount = inventoryItems.length
  const totalSold = product.totalSold ?? stockOverview?.totalSold ?? 0
  const totalRevenue = product.totalRevenue ?? stockOverview?.totalRevenue ?? 0
  const profitPerUnit = product.price && product.costPrice ? product.price - product.costPrice : 0
  const profitMarginPercent = product.profitMargin ?? (product.price > 0 ? Math.round(((product.price - product.costPrice) / product.price) * 100) : 0)
  const salesTaxRate = product.salesTax?.taxType === "exempt" ? 0 : product.salesTax?.rate ?? 0
  const purchaseTaxRate = product.purchaseTax?.taxType === "exempt" ? 0 : product.purchaseTax?.rate ?? 0
  const sku = product.base_sku || product.variants?.[0]?.sku || '—'
  const barcode = product.barcode || product.variants?.[0]?.barcode || ''

  // Recent sales extraction
  const recentSales = salesData?.items || []
  // Recent purchases extraction
  const recentPurchases = purchasesData?.items || []

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd')
    } catch {
      return dateStr
    }
  }

  // Quantity badge color based on value
  const getQuantityColor = (qty: number) => {
    if (qty >= 50) return 'bg-emerald-100 text-emerald-700'
    if (qty >= 20) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-6">
      {/* ===== Header Section ===== */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            {product.description ? `${product.description}` : ''}
            {product.description && sku !== '—' ? ' · ' : ''}
            {sku !== '—' && <span className="font-mono">SKU: {sku}</span>}
          </p>
        </div>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* In Stock */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            <p className="text-3xl font-bold">{totalStock.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              across {locationCount} {locationCount === 1 ? 'location' : 'locations'}
            </p>
          </CardContent>
        </Card>

        {/* Total Sold */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Total Sold</span>
            </div>
            <p className="text-3xl font-bold">{totalSold.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSold > 0 ? `~${Math.round(totalSold / 12)}/month avg` : 'No sales yet'}
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">lifetime earnings</p>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Profit Margin</span>
            </div>
            <p className="text-3xl font-bold">{profitMarginPercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(profitPerUnit)} per unit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== Two Column Layout: Product Info + Stock by Location ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-emerald-600" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Product Type</span>
                <span className="text-sm font-medium capitalize">{product.productType}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Brand</span>
                <span className="text-sm font-medium">{product.brand?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">{product.category?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Unit</span>
                <span className="text-sm font-medium">{product.unit?.name || '—'}</span>
              </div>
              {barcode && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Barcode</span>
                  <span className="text-sm font-medium font-mono">{barcode}</span>
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            {inventoryItems.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Low Stock Alert</span>
                  <span className="text-sm font-medium">
                    ≤ {inventoryItems[0]?.quantityAlert ?? 0} units
                  </span>
                </div>
              </>
            )}

            {/* Description */}
            {product.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm leading-relaxed">{product.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock by Location Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Stock by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Shelf</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item: InventoryItem) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        {item.location?.name || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.shelf || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={`${getQuantityColor(item.quantity)} border-0 font-semibold`}
                        >
                          {item.quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-10 h-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No stock data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Variants Section (if variable product) ===== */}
      {hasVariants && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="w-4 h-4 text-emerald-600" />
              Product Variants ({product.variants?.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.variants?.map((variant) => (
                <div
                  key={variant._id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <Badge key={key} variant="secondary">
                            {key}: {value as string}
                          </Badge>
                        ))}
                        <StatusBadge status={variant.status} />
                      </div>
                      {variant.sku && (
                        <p className="text-sm text-muted-foreground font-mono">
                          SKU: {variant.sku}
                        </p>
                      )}
                      {variant.images && Array.isArray(variant.images) && variant.images.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {variant.images.map((img: any, imgIdx: number) => (
                            <div
                              key={img.publicId || imgIdx}
                              className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative border"
                            >
                              <Image
                                src={img.thumbnailUrl || img.url}
                                alt={`${Object.values(variant.attributes).join(' ')} image ${imgIdx + 1}`}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(variant.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cost: {formatCurrency(variant.costPrice)}
                      </p>
                      {variant.costPrice > 0 && (
                        <p className="text-xs text-blue-600 font-medium">
                          {(((variant.price - variant.costPrice) / variant.price) * 100).toFixed(1)}% margin
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Recent Sales & Purchases Tabs ===== */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="sales">
            <TabsList className="w-full justify-center">
              <TabsTrigger value="sales" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Recent Sales
              </TabsTrigger>
              <TabsTrigger value="purchases" className="gap-2">
                <Truck className="w-4 h-4" />
                Recent Purchases
              </TabsTrigger>
            </TabsList>

            {/* Recent Sales Tab */}
            <TabsContent value="sales">
              {Array.isArray(recentSales) && recentSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.slice(0, 5).map((sale: any) => (
                      <TableRow key={sale._id}>
                        <TableCell className="font-mono text-sm">
                          {sale.invoiceNumber || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sale.createdAt ? formatDate(sale.createdAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {sale.customerId?.name || sale.customer?.name || 'Walk-in'}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.totalAmount || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent sales</p>
                </div>
              )}
            </TabsContent>

            {/* Recent Purchases Tab */}
            <TabsContent value="purchases">
              {Array.isArray(recentPurchases) && recentPurchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPurchases.slice(0, 5).map((po: any) => (
                      <TableRow key={po._id}>
                        <TableCell className="font-mono text-sm">
                          {po.orderNumber || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {po.createdAt ? formatDate(po.createdAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {po.supplierId?.name || po.supplier?.name || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {po.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(po.grandTotal || po.totalAmount || po.subtotal || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Truck className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent purchases</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ===== Bottom Row: Pricing + Timeline ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="w-4 h-4 text-emerald-600" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Cost Price</span>
                <span className="text-sm font-medium">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Selling Price</span>
                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(product.price)}</span>
              </div>
              {product.mrp != null && product.mrp > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">MRP</span>
                  <span className="text-sm font-medium">{formatCurrency(product.mrp)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Profit/Unit</span>
                <span className="text-sm font-medium">{formatCurrency(profitPerUnit)}</span>
              </div>
              {salesTaxRate > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Sales Tax</span>
                  <span className="text-sm font-medium">{salesTaxRate}%</span>
                </div>
              )}
              {purchaseTaxRate > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Purchase Tax</span>
                  <span className="text-sm font-medium">{purchaseTaxRate}%</span>
                </div>
              )}
              {product.discountValue != null && product.discountValue > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Discount</span>
                    <span className="text-sm font-medium text-orange-600">
                      {product.discountType === 'fixed'
                        ? formatCurrency(product.discountValue)
                        : `${product.discountValue}%`} off
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-emerald-600" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">{formatDate(product.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-medium">{formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
