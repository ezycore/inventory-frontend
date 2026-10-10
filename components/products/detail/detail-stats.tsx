// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@ui/components/card'
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  BarChart3,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'

interface DetailStatsProps {
  totalStock: number
  locationCount: number
  totalSold: number
  totalRevenue: number
  /** `null` when neither a sale nor today's price has a cost behind it — no margin to show. */
  profitMarginPercent: number | null
  profitPerUnit: number | null
  stockValue: number
  /** Sales module gate — hide transactional sales tiles when off. */
  salesEnabled: boolean
  /** Off for a business that never counts stock — see `useStockTracked`. */
  stockTracked: boolean
  formatCurrency: (n: number) => string
}

interface Stat {
  icon: LucideIcon
  label: string
  value: string
  sub: string
}

function StatTile({ stat }: { stat: Stat }) {
  const Icon = stat.icon
  return (
    <Card>
      <CardContent className="pb-4 pt-5">
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate text-sm font-medium">{stat.label}</span>
        </div>
        {/* A currency amount at text-3xl is wider than a half-width mobile tile, and the
            card does not clip — step the size down and wrap long amounts instead. */}
        <p className="break-words text-xl font-bold tabular-nums sm:text-2xl lg:text-3xl">
          {stat.value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
      </CardContent>
    </Card>
  )
}

export function DetailStats({
  totalStock,
  locationCount,
  totalSold,
  totalRevenue,
  profitMarginPercent,
  profitPerUnit,
  stockValue,
  salesEnabled,
  stockTracked,
  formatCurrency,
}: DetailStatsProps) {
  // Stock value and profit tiles are cost-derived — costs.view only.
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const t = useTranslations('products.products.detail.stats')

  const stats: Stat[] = [
    // Both stock tiles are structurally meaningless without stock tracking, and
    // in opposite ways: "In stock" reads 0 off a ghost inventory row that exists
    // only so `SaleItem.inventoryId` resolves, and stock value is that same 0
    // times a cost price — a valuation needs a quantity (QA-N14). Cost price
    // itself survives, in the Pricing card lower down.
    ...(stockTracked
      ? [
          {
            icon: ShieldCheck,
            label: t('inStock'),
            value: totalStock.toLocaleString(),
            sub: t('acrossLocations', { count: locationCount }),
          },
        ]
      : []),
    ...(canViewCosts && stockTracked
      ? [
          {
            icon: Wallet,
            label: t('stockValue'),
            value: formatCurrency(stockValue),
            sub: t('atCostPrice'),
          },
        ]
      : []),
    // Transactional sales tiles — only when the sales module is on.
    ...(salesEnabled
      ? [
          {
            icon: TrendingUp,
            label: t('totalSold'),
            value: totalSold.toLocaleString(),
            sub: totalSold > 0 ? t('monthlyAvg', { count: Math.round(totalSold / 12) }) : t('noSalesYet'),
          },
          {
            icon: DollarSign,
            label: t('revenue'),
            value: formatCurrency(totalRevenue),
            sub: t('lifetimeEarnings'),
          },
        ]
      : []),
    ...(canViewCosts
      ? [
          {
            icon: BarChart3,
            label: t('profitMargin'),
            value: profitMarginPercent === null ? '—' : `${profitMarginPercent}%`,
            sub:
              profitPerUnit === null
                ? t('noCost')
                : t('perUnit', { amount: formatCurrency(profitPerUnit) }),
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} />
      ))}
    </div>
  )
}
