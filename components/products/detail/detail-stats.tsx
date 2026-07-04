// coding-standard: maintained
'use client'

import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  BarChart3,
  Wallet,
} from 'lucide-react'
import { StatTile, type Stat } from './stat-tile'

interface DetailStatsProps {
  totalStock: number
  /** Expired on-hand and sellable = total − expired (across locations). */
  totalExpired?: number
  totalSellable?: number
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

export function DetailStats({
  totalStock,
  totalExpired = 0,
  totalSellable,
  locationCount,
  totalSold,
  totalRevenue,
  profitMarginPercent,
  profitPerUnit,
  stockValue,
  salesEnabled,
  formatCurrency,
}: DetailStatsProps) {
  const sellable = totalSellable ?? totalStock
  const locationSub = `across ${locationCount} ${locationCount === 1 ? 'location' : 'locations'}`
  const stats: Stat[] = [
    // Sellable-first when any stock is expired; plain total otherwise.
    totalExpired > 0
      ? {
          icon: ShieldCheck,
          label: 'Sellable',
          value: sellable.toLocaleString(),
          sub: `${totalExpired.toLocaleString()} expired · ${totalStock.toLocaleString()} on hand`,
        }
      : {
          icon: ShieldCheck,
          label: 'In Stock',
          value: totalStock.toLocaleString(),
          sub: locationSub,
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
