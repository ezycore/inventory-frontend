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
  profitMarginPercent: number
  profitPerUnit: number
  stockValue: number
  /** Sales module gate — hide transactional sales tiles when off. */
  salesEnabled: boolean
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
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{stat.label}</span>
        </div>
        <p className="text-3xl font-bold">{stat.value}</p>
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
  formatCurrency,
}: DetailStatsProps) {
  // Stock value and profit tiles are cost-derived — costs.view only.
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const t = useTranslations('products.products.detail.stats')

  const stats: Stat[] = [
    {
      icon: ShieldCheck,
      label: t('inStock'),
      value: totalStock.toLocaleString(),
      sub: t('acrossLocations', { count: locationCount }),
    },
    ...(canViewCosts
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
            value: `${profitMarginPercent}%`,
            sub: t('perUnit', { amount: formatCurrency(profitPerUnit) }),
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
