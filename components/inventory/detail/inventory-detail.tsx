// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, MapPin, Package, TrendingDown, TrendingUp, Wallet, Bell } from 'lucide-react'
import { Card, CardContent } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { Button } from '@ui/components/button'
import { useInventoryAnalytics } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { isFeatureEnabled } from '@/lib/feature-utils'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'
import { useAuthStore } from '@/services/stores'
import { InventoryCharts } from './inventory-charts'
import { InventoryActivity } from './inventory-activity'
import { InventoryBatches } from './inventory-batches'

interface InventoryDetailProps {
  inventoryId: string
  onClose?: () => void
}

export function InventoryDetail({ inventoryId, onClose }: InventoryDetailProps) {
  const t = useTranslations('inventory.detail')
  const tCommon = useTranslations('common')
  const { format: formatCurrency } = useCurrency()
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const features = useAuthStore((s) => s.user?.organization?.features)
  const barcodeEnabled = isFeatureEnabled(features, 'barcodeSystem')
  const expiryEnabled = isFeatureEnabled(features, 'expiryTracking')
  const { data: analytics, isLoading, error } = useInventoryAnalytics(inventoryId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">{t('notFoundTitle')}</h2>
        <p className="mb-4 text-muted-foreground">
          {t('notFoundBody')}
        </p>
        {onClose && <Button onClick={onClose}>{tCommon('actions.close')}</Button>}
      </div>
    )
  }

  const { inventory, product, variant, location, movement, batches } = analytics
  const unitLabel = product?.unit?.shortName || product?.unit?.name || t('unitsLabel')

  // Link to the full movements page, scoped to this exact inventory record
  // (product + variant + location), shown only when more than the 10 listed exist.
  const activityHref =
    analytics.movementTotal > analytics.recentMovements.length && product?._id && location?._id
      ? `/inventory/movements?productId=${product._id}${variant ? `&variantId=${variant._id}` : ''}&locationId=${location._id}`
      : undefined

  return (
    <div className="space-y-6">
      <Hero
        name={product?.name || '—'}
        image={product?.image ?? null}
        barcode={barcodeEnabled ? product?.barcode || '' : ''}
        locationName={location?.name || '—'}
        attributes={variant?.attributes}
        quantity={inventory.quantity}
        unitLabel={unitLabel}
        status={inventory.status}
        isLowStock={inventory.isLowStock}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Package} label={t('onHand')} value={`${inventory.quantity.toLocaleString()}`} sub={unitLabel} />
        {canViewCosts && (
          <StatTile icon={Wallet} label={t('stockValue')} value={formatCurrency(inventory.stockValue)} sub={t('atCostPrice')} />
        )}
        <StatTile icon={Bell} label={t('alertLevel')} value={inventory.quantityAlert.toLocaleString()} sub={t('reorderThreshold')} />
        <StatTile
          icon={movement.netChange >= 0 ? TrendingUp : TrendingDown}
          label={t('netChange')}
          value={`${movement.netChange >= 0 ? '+' : ''}${movement.netChange.toLocaleString()}`}
          sub={t('inOutSummary', { in: movement.stockIn.quantity, out: movement.stockOut.quantity })}
        />
      </div>

      <InventoryCharts analytics={analytics} />

      <InventoryActivity
        movements={analytics.recentMovements}
        timezone={analytics.timezone}
        viewAllHref={activityHref}
      />

      {expiryEnabled && batches && batches.length > 0 && (
        <InventoryBatches batches={batches} formatCurrency={formatCurrency} />
      )}
    </div>
  )
}

interface HeroProps {
  name: string
  image: string | null
  barcode: string
  locationName: string
  attributes?: Record<string, unknown>
  quantity: number
  unitLabel: string
  status: string
  isLowStock: boolean
}

function Hero({
  name,
  image,
  barcode,
  locationName,
  attributes,
  quantity,
  unitLabel,
  status,
  isLowStock,
}: HeroProps) {
  const t = useTranslations('inventory.detail')
  const tStatus = useTranslations('common.status')
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {locationName}
              </span>
              {barcode && <span className="font-mono text-xs">{barcode}</span>}
            </div>
            {attributes && Object.keys(attributes).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {Object.entries(attributes).map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <Badge variant={status === 'active' ? 'secondary' : 'outline'}>
              {tStatus.has(status) ? tStatus(status) : status}
            </Badge>
            {isLowStock && <Badge variant="destructive">{t('lowStockBadge')}</Badge>}
          </div>
          <p className="text-3xl font-bold">
            {quantity.toLocaleString()} <span className="text-base font-medium text-muted-foreground">{unitLabel}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatTileProps {
  icon: typeof Package
  label: string
  value: string
  sub: string
}

function StatTile({ icon: Icon, label, value, sub }: StatTileProps) {
  return (
    <Card>
      <CardContent className="pb-4 pt-5">
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
