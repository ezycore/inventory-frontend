// coding-standard: maintained
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import {
  Layers,
  PackageCheck,
  TrendingUp,
  DollarSign,
  BarChart3,
  Wallet,
  Tag,
} from 'lucide-react'
import { useComboDetail, useComboSalesReport } from '@/services/api'
import type { ComboComponentDetail } from '@/services/api/modules/inventory/analytics.types'
import { StatTile, type Stat } from './stat-tile'
import { DetailHero } from './detail-hero'
import { DetailTimeline } from './detail-timeline'
import { DetailComboActivity } from './detail-combo-activity'

// The combo sales report has no "all-time" period, so a wide custom range stands
// in for lifetime figures (matches how single-product stats read lifetime).
const LIFETIME = { period: 'custom' as const, startDate: '2000-01-01', endDate: '2999-12-31' }

interface DetailComboProps {
  product: any
  barcode: string
  /** Sales module gate — hide the sold/revenue tiles when off. */
  salesEnabled: boolean
  formatCurrency: (n: number) => string
}

/**
 * Combo product detail. Combos hold no inventory of their own, so instead of the
 * stock/movement surfaces we show the composition (each component's live stock +
 * cost), the combo-level availability/cost/margin, and lifetime combo sales.
 */
export function DetailCombo({ product, barcode, salesEnabled, formatCurrency }: DetailComboProps) {
  const { data: combo, isLoading } = useComboDetail(product._id)
  const { data: salesReport } = useComboSalesReport(LIFETIME, salesEnabled)
  const sales = salesReport?.combos.find((c) => c.comboId === product._id)

  if (isLoading || !combo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const profitPerUnit = combo.price - combo.costPrice
  const margin =
    combo.price > 0 ? Math.round((profitPerUnit / combo.price) * 100) : 0
  const unitsSold = sales?.unitsSold ?? 0
  const taxLabel =
    combo.taxType === 'exempt' || !combo.taxRate
      ? 'No tax'
      : `${combo.taxRate}% ${combo.taxType}`

  const stats: Stat[] = [
    {
      icon: PackageCheck,
      label: 'Available',
      value: combo.availability.toLocaleString(),
      sub: combo.availability > 0 ? 'combos sellable now' : 'a component is out of stock',
    },
    {
      icon: Wallet,
      label: 'Combo Cost',
      value: formatCurrency(combo.costPrice),
      sub: 'sum of component cost',
    },
    ...(salesEnabled
      ? [
          {
            icon: TrendingUp,
            label: 'Combos Sold',
            value: (sales?.unitsSold ?? 0).toLocaleString(),
            sub: sales?.orders ? `${sales.orders} orders` : 'No sales yet',
          },
          {
            icon: DollarSign,
            label: 'Revenue',
            value: formatCurrency(sales?.revenue ?? 0),
            sub: 'lifetime earnings',
          },
        ]
      : []),
    {
      icon: BarChart3,
      label: 'Profit Margin',
      value: `${margin}%`,
      sub: `${formatCurrency(profitPerUnit)} per combo`,
    },
  ]

  const columns: SimpleColumn<ComboComponentDetail>[] = [
    { key: 'name', header: 'Component', cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'qty', header: 'Per combo', align: 'right', cell: (r) => `×${r.quantity}` },
    { key: 'stock', header: 'In stock', align: 'right', cell: (r) => r.availableQuantity.toLocaleString() },
    { key: 'makes', header: 'Makes', align: 'right', cell: (r) => r.maxCombos.toLocaleString() },
    { key: 'price', header: 'Unit price', align: 'right', cell: (r) => formatCurrency(r.unitPrice) },
    { key: 'cost', header: 'Unit cost', align: 'right', cell: (r) => formatCurrency(r.costPrice) },
  ]

  return (
    <div className="space-y-6">
      <DetailHero
        product={product}
        sellingPrice={combo.price}
        barcode={barcode}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <StatTile key={stat.label} stat={stat} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-emerald-600" />
            Combo composition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleTable
            columns={columns}
            rows={combo.components}
            getRowKey={(r) => `${r.productId}|${r.variantId ?? ''}`}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            &ldquo;Makes&rdquo; is how many whole combos each component alone can supply; combo
            availability is the smallest of these.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4 text-emerald-600" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PricingRow
            label="Selling price"
            value={<span className="font-semibold text-emerald-600">{formatCurrency(combo.price)}</span>}
          />
          <PricingRow label="Sales tax" value={taxLabel} />
          <PricingRow label="Combo cost" value={formatCurrency(combo.costPrice)} />
          <PricingRow label="Profit / combo" value={formatCurrency(profitPerUnit)} />
          {salesEnabled && (
            <PricingRow
              label="Total profit"
              value={
                <span className="font-semibold">{formatCurrency(profitPerUnit * unitsSold)}</span>
              }
              sub={`${unitsSold.toLocaleString()} sold`}
            />
          )}
        </CardContent>
      </Card>

      {salesEnabled && (
        <DetailComboActivity comboProductId={product._id} formatCurrency={formatCurrency} />
      )}

      <DetailTimeline createdAt={product.createdAt} updatedAt={product.updatedAt} />
    </div>
  )
}

function PricingRow({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right text-sm">
        {value}
        {sub && <span className="ml-2 text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}
