'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Card } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { AreaChart } from '@ui/components/charts'
import EmptyState from '@ui/components/EmptyState'
import { TrendingUp } from 'lucide-react'
import type { DashboardOverview } from '@/services/api'

interface ChartSectionProps {
  overview?: DashboardOverview
  isLoading: boolean
  formatCurrency: (v: number) => string
  /**
   * Whether this business buys from suppliers — read off the composed block
   * list by the caller, not from a flag on the payload. The purchases series is
   * a flat zero line for a merchant who buys from nobody, under a title naming a
   * comparison they cannot make (QA-C1).
   */
  showPurchases: boolean
  /**
   * Whether this business takes online orders — read off the composed block list
   * by the caller. The orders series is its own line, not folded into `sales`:
   * the two are on different clocks (a counter sale is money the moment it
   * rings, an order is money the day it is placed and a Sale only at dispatch),
   * so adding them into one line would draw a shape neither channel had.
   */
  showOrders: boolean
  /**
   * Whether this business sells at a POS counter. A storefront-only seller has
   * no "sales" line to draw — their trade is the orders line
   * (docs/plan/orders-first-storefront.md).
   */
  showSales: boolean
}

export function ChartSection({
  overview,
  isLoading,
  formatCurrency,
  showPurchases: purchasesTracked,
  showOrders,
  showSales,
}: ChartSectionProps) {
  const t = useTranslations('dashboard.chart')
  if (isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </Card>
    )
  }

  if ((overview?.chartData || []).length > 0) {
    const groupingLabel =
      overview?.period.chartGrouping === 'hourly'
        ? t('groupingHourly')
        : overview?.period.chartGrouping === 'daily'
          ? t('groupingDaily')
          : overview?.period.chartGrouping === 'weekly'
            ? t('groupingWeekly')
            : t('groupingMonthly')

    return (
      <AreaChart
        data={overview!.chartData}
        // The purchases series is a flat zero line for a merchant who buys from
        // nobody, under a title naming a comparison they cannot make (QA-C1).
        // Same degrade the Purchase Cost KPI already applies off the same flag —
        // the data still ships, this decides whether it is drawn.
        series={[
          ...(showSales
            ? [
                {
                  dataKey: 'sales',
                  // Beside an orders line it is the counter half, and says so.
                  name: showOrders ? t('counterSales') : t('sales'),
                  color: 'var(--color-primary)',
                },
              ]
            : []),
          ...(showOrders
            ? [
                {
                  dataKey: 'orders',
                  name: t('orders'),
                  color: 'var(--color-chart-1)',
                },
              ]
            : []),
          ...(purchasesTracked
            ? [
                {
                  dataKey: 'purchases',
                  name: t('purchases'),
                  color: 'var(--color-chart-2)',
                },
              ]
            : []),
        ]}
        title={
          !showSales
            ? t('onlyOrdersTitle')
            : purchasesTracked
              ? t('title')
              : showOrders
                ? t('ordersTitle')
                : t('salesTitle')
        }
        subtitle={t('breakdownSuffix', { grouping: groupingLabel })}
        height={260}
        className="overflow-hidden"
        tooltipFormatter={(v) => formatCurrency(v)}
      />
    )
  }

  return (
    <Card className="p-5">
      <EmptyState
        icon={TrendingUp}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        compact
      />
    </Card>
  )
}
