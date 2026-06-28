// coding-standard: maintained
'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Skeleton } from '@ui/components/skeleton'
import {
  useProduct,
  useProductBySlug,
  useProductAnalytics,
  useStockMovements,
  inventoryApi,
} from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { isFeatureEnabled, isTaxActive } from '@/lib/feature-utils'
import { useAuthStore } from '@/services/stores'
import { DetailHero } from './detail/detail-hero'
import { DetailStats } from './detail/detail-stats'
import { DetailCharts } from './detail/detail-charts'
import { DetailInfoCard } from './detail/detail-info-card'
import { DetailVariants } from './detail/detail-variants'
import { DetailActivity } from './detail/detail-activity'
import { DetailPricing } from './detail/detail-pricing'
import { DetailTimeline } from './detail/detail-timeline'
import { DetailStorefront } from './detail/detail-storefront'
import type { InventoryItem } from './detail/utils'

interface ProductDetailProps {
  /** Resolve by Mongo id (drawer usage from list/card views). */
  productId?: string
  /** Resolve by slug (full-page route /products/[slug]). */
  slug?: string
  onClose?: () => void
}

export function ProductDetail({ productId, slug, onClose }: ProductDetailProps) {
  const { format: formatCurrency } = useCurrency()
  const organization = useAuthStore((s) => s.user?.organization)

  // Resolve the product by whichever key the caller provided. Both hooks are
  // always called (rules of hooks); each self-disables when its key is empty.
  const byId = useProduct(productId ?? '')
  const bySlug = useProductBySlug(slug ?? '')
  const { data: product, isLoading, error } = slug ? bySlug : byId
  // Secondary queries key off the resolved Mongo id, not the route param.
  const resolvedId = product?._id ?? productId ?? ''

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'product', resolvedId],
    queryFn: () => inventoryApi.getAll({ productId: resolvedId }),
    enabled: !!resolvedId,
    select: (data) => data.data,
  })

  // Aggregated analytics (stock by location, lifetime sales, movement trend).
  const { data: analytics } = useProductAnalytics(resolvedId)

  // Product-scoped stock activity ledger (in/out movements for THIS product).
  const { data: movementsData } = useStockMovements({ productId: resolvedId, limit: 10 })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Product Not Found</h2>
        <p className="mb-4 text-muted-foreground">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        {onClose && <Button onClick={onClose}>Close</Button>}
      </div>
    )
  }

  const hasVariants =
    product.productType === 'variable' && product.variants && product.variants.length > 0

  const inventoryItems: InventoryItem[] = inventoryData?.items || (inventoryData as any) || []
  const totalStock =
    analytics?.stock.totalQuantity ??
    product.totalStock ??
    inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const locationCount = analytics?.stock.locationCount ?? inventoryItems.length
  const totalSold = analytics?.sales.unitsSold ?? product.totalSold ?? 0
  const totalRevenue = analytics?.sales.revenue ?? product.totalRevenue ?? 0
  // Cost lives on inventory (weighted moving avg), not the product. Derive a
  // weighted-average unit cost from analytics; fall back to the product field.
  const derivedCost =
    analytics && analytics.stock.totalQuantity > 0
      ? analytics.stock.stockValue / analytics.stock.totalQuantity
      : analytics?.stock.byLocation.find((l) => l.costPrice > 0)?.costPrice ?? 0
  const costPrice = derivedCost || product.costPrice || 0
  const profitPerUnit = product.price ? product.price - costPrice : 0
  const profitMarginPercent =
    analytics?.sales.margin ??
    product.profitMargin ??
    (product.price > 0 ? Math.round(((product.price - costPrice) / product.price) * 100) : 0)
  const stockValue = analytics?.stock.stockValue ?? totalStock * costPrice
  const salesTaxRate = product.salesTax?.taxType === 'exempt' ? 0 : product.salesTax?.rate ?? 0
  const purchaseTaxRate = product.purchaseTax?.taxType === 'exempt' ? 0 : product.purchaseTax?.rate ?? 0
  const movements = movementsData?.data?.items || []
  // Module gates — keep every detail surface honest to the org's enabled features.
  const expiryEnabled = isFeatureEnabled(organization?.features, 'expiryTracking')
  const barcodeEnabled = isFeatureEnabled(organization?.features, 'barcodeSystem')
  const salesEnabled = isFeatureEnabled(organization?.features, 'sales')
  const salesTaxActive = isTaxActive(organization, 'sales')
  const purchaseTaxActive = isTaxActive(organization, 'purchase')
  // Barcode is only meaningful with the barcode module on.
  const barcode = barcodeEnabled
    ? product.barcode || product.variants?.[0]?.barcode || ''
    : ''

  return (
    <div className="space-y-6">
      <DetailHero product={product} barcode={barcode} formatCurrency={formatCurrency} />

      <DetailStats
        totalStock={totalStock}
        locationCount={locationCount}
        totalSold={totalSold}
        totalRevenue={totalRevenue}
        profitMarginPercent={profitMarginPercent}
        profitPerUnit={profitPerUnit}
        stockValue={stockValue}
        salesEnabled={salesEnabled}
        formatCurrency={formatCurrency}
      />

      {analytics && (
        <DetailCharts analytics={analytics} salesEnabled={salesEnabled} formatCurrency={formatCurrency} />
      )}

      <DetailInfoCard product={product} inventoryItems={inventoryItems} expiryEnabled={expiryEnabled} />

      {hasVariants && <DetailVariants variants={product.variants} formatCurrency={formatCurrency} />}

      <DetailActivity movements={movements} />

      {product.storefront && (
        <DetailStorefront storefront={product.storefront} formatCurrency={formatCurrency} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailPricing
          product={product}
          costPrice={costPrice}
          profitPerUnit={profitPerUnit}
          salesTaxRate={salesTaxRate}
          purchaseTaxRate={purchaseTaxRate}
          salesTaxActive={salesTaxActive}
          purchaseTaxActive={purchaseTaxActive}
          formatCurrency={formatCurrency}
        />
        <DetailTimeline createdAt={product.createdAt} updatedAt={product.updatedAt} />
      </div>
    </div>
  )
}
