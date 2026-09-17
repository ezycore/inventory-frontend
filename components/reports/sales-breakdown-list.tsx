'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import type { SalesBreakdownRow } from '@/services/api/modules/reports/api'
import type { BreakdownMetric, RankedRow } from '@/utils/sales-breakdown'
import { cn } from '@ui/lib/utils'

interface SalesBreakdownListProps {
  title: string
  icon: LucideIcon
  items: RankedRow[]
  metric: BreakdownMetric
  /** The largest value of `metric` across ALL groups, so both lists share one bar scale. */
  maxValue: number
  tone: 'top' | 'low'
  formatCurrency: (n: number) => string
}

/**
 * One end of the sales breakdown ranking — top sellers or lowest sellers.
 *
 * The chosen metric is the headline figure and the bar; the other two ride underneath with the
 * share, so switching "Rank by" never hides a number.
 */
export function SalesBreakdownList({
  title,
  icon: Icon,
  items,
  metric,
  maxValue,
  tone,
  formatCurrency,
}: SalesBreakdownListProps) {
  const t = useTranslations('reports.sales.breakdown')

  const figures: Record<BreakdownMetric, (row: SalesBreakdownRow) => string> = {
    revenue: (row) => formatCurrency(row.revenue),
    units: (row) => t('units', { count: row.units }),
    orders: (row) => t('orders', { count: row.orders }),
  }

  const details = (row: SalesBreakdownRow) =>
    [
      ...(Object.keys(figures) as BreakdownMetric[])
        .filter((m) => m !== metric)
        .map((m) => figures[m](row)),
      t('share', { value: row.share }),
    ].join(' · ')

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon
          className={cn('h-4 w-4', tone === 'top' ? 'text-green-600' : 'text-amber-600')}
        />
        {title}
      </h3>
      <ol className="space-y-3">
        {items.map(({ row, rank }) => {
          const width = maxValue > 0 ? Math.max(0, (row[metric] / maxValue) * 100) : 0
          return (
            <li key={row.id} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                    {rank}
                  </span>
                  <span className={cn('truncate font-medium', !row.name && 'italic')}>
                    {row.name ?? t('deleted')}
                  </span>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {figures[metric](row)}
                </span>
              </div>
              <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    tone === 'top' ? 'bg-primary/80' : 'bg-amber-500/70',
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className="ml-8 text-xs text-muted-foreground">{details(row)}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
