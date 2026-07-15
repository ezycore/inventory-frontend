// coding-standard: maintained
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Skeleton } from '@ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@ui/components/tabs'
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

/** Short label for a variant tab from its attribute values. */
function variantLabel(variant: any, fallback: string): string {
  const values = Object.values(variant?.attributes || {}).map((v) => String(v))
  return values.length ? values.join(' / ') : fallback
}

export function ProductDetail({ productId, slug, onClose }: ProductDetailProps) {
  const t = useTranslations('products.products.detail')
  const { format: formatCurrency } = useCurrency()
  const organization = useAuthStore((s) => s.user?.organization)

  // Resolve the product by whichever key the caller provided. Both hooks are
  // always called (rules of hooks); each self-disables when its key is empty.
  const byId = useProduct(productId ?? '')
  const bySlug = useProductBySlug(slug ?? '')
  const { data: product, isLoading, error } = slug ? bySlug : byId
  // Secondary queries key off the resolved Mongo id, not the route param.
  const resolvedId = product?._id ?? productId ?? ''

  // Variant tab selection for variable products: the first variant is selected by
  // default and every metric below is scoped to the active variant (no aggregate).
  const [variantTab, setVariantTab] = useState('')
  const firstVariantId: string | undefined = product?.variants?.[0]?._id
  const isVariableProduct = product?.productType === 'variable' && !!firstVariantId
  const selectedVariantId = isVariableProduct ? variantTab || firstVariantId : undefined

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'product', resolvedId],
    queryFn: () => inventoryApi.getAll({ productId: resolvedId }),
    enabled: !!resolvedId,
    select: (data) => data.data,
  })

  // Aggregated analytics — scoped to the selected variant (or product-wide).
  const { data: analytics } = useProductAnalytics(resolvedId, selectedVariantId)

  // Stock activity ledger (in/out movements), scoped to the selected variant.
  const { data: movementsData } = useStockMovements({
    productId: resolvedId,
    variantId: selectedVariantId,
    limit: 10,
  })

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
        <h2 className="mb-2 text-xl font-semibold">{t('notFoundTitle')}</h2>
        <p className="mb-4 text-muted-foreground">
          {t('notFoundDescription')}
        </p>
        {onClose && <Button onClick={onClose}>{t('close')}</Button>}
      </div>
    )
  }

  const hasVariants =
    product.productType === 'variable' && product.variants && product.variants.length > 0

  const inventoryItems: InventoryItem[] = inventoryData?.items || (inventoryData as any) || []
  // Scope the info-card inventory rows (low-stock alert) to the selected variant.
  const scopedInventoryItems = selectedVariantId
    ? inventoryItems.filter((i) => i.variantId === selectedVariantId)
    : inventoryItems
  const totalStock =
    analytics?.stock.totalQuantity ??
    inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const locationCount = analytics?.stock.locationCount ?? inventoryItems.length
  const totalSold = analytics?.sales.unitsSold ?? 0
  const totalRevenue = analytics?.sales.revenue ?? 0
  // Cost lives on inventory (weighted moving avg), not the product — derive a
  // weighted-average unit cost from analytics.
  const derivedCost =
    analytics && analytics.stock.totalQuantity > 0
      ? analytics.stock.stockValue / analytics.stock.totalQuantity
      : analytics?.stock.byLocation.find((l) => l.costPrice > 0)?.costPrice ?? 0
  const costPrice = derivedCost || 0
  // Selling price is per-variant for variable products (product.price is unset
  // there); fall back to the product price for single products / the 'all' tab.
  const selectedVariant = selectedVariantId
    ? product.variants?.find((v: any) => v._id === selectedVariantId)
    : null
  const unitPrice = selectedVariant?.price ?? product.price ?? 0
  const profitPerUnit = unitPrice ? unitPrice - costPrice : 0
  const profitMarginPercent =
    analytics?.sales.margin ??
    (unitPrice > 0 ? Math.round(((unitPrice - costPrice) / unitPrice) * 100) : 0)
  const stockValue = analytics?.stock.stockValue ?? totalStock * costPrice
  const salesTaxRate = product.salesTax?.taxType === 'exempt' ? 0 : product.salesTax?.rate ?? 0
  const purchaseTaxRate = product.purchaseTax?.taxType === 'exempt' ? 0 : product.purchaseTax?.rate ?? 0
  const movements = movementsData?.data?.items || []
  const movementTotal = movementsData?.data?.total ?? movements.length
  // Link to the full movements page, scoped to this product (and active variant),
  // shown only when there are more movements than the 10 listed here.
  const activityHref =
    movementTotal > movements.length && resolvedId
      ? `/inventory/movements?productId=${resolvedId}${selectedVariantId ? `&variantId=${selectedVariantId}` : ''}`
      : undefined
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
      <DetailHero
        key={selectedVariantId || 'product'}
        product={product}
        variant={selectedVariant}
        sellingPrice={unitPrice}
        barcode={barcode}
        formatCurrency={formatCurrency}
      />

      {hasVariants && (
        <Tabs value={selectedVariantId} onValueChange={setVariantTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max">
              {product.variants.map((v: any) => (
                <TabsTrigger key={v._id} value={v._id}>
                  {variantLabel(v, t('defaultVariantLabel'))}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      )}

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

      <DetailInfoCard product={product} inventoryItems={scopedInventoryItems} expiryEnabled={expiryEnabled} />

      {hasVariants && <DetailVariants variants={product.variants} formatCurrency={formatCurrency} />}

      <DetailActivity movements={movements} timezone={organization?.timezone} viewAllHref={activityHref} />

      {product.storefront && (
        <DetailStorefront storefront={product.storefront} formatCurrency={formatCurrency} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailPricing
          product={product}
          sellingPrice={unitPrice}
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
