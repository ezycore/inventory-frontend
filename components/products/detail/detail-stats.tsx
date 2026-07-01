// coding-standard: maintained
'use client'

import { Card, CardContent } from '@ui/components/card'
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  BarChart3,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

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
  const stats: Stat[] = [
    {
      icon: ShieldCheck,
      label: 'In Stock',
      value: totalStock.toLocaleString(),
      sub: `across ${locationCount} ${locationCount === 1 ? 'location' : 'locations'}`,
    },
    {
      icon: Wallet,
      label: 'Stock Value',
      value: formatCurrency(stockValue),
      sub: 'at cost price',
    },
    // Transactional sales tiles — only when the sales module is on.
    ...(salesEnabled
      ? [
          {
            icon: TrendingUp,
            label: 'Total Sold',
            value: totalSold.toLocaleString(),
            sub: totalSold > 0 ? `~${Math.round(totalSold / 12)}/month avg` : 'No sales yet',
          },
          {
            icon: DollarSign,
            label: 'Revenue',
            value: formatCurrency(totalRevenue),
            sub: 'lifetime earnings',
          },
        ]
      : []),
    {
      icon: BarChart3,
      label: 'Profit Margin',
      value: `${profitMarginPercent}%`,
      sub: `${formatCurrency(profitPerUnit)} per unit`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} />
      ))}
    </div>
  )
}
