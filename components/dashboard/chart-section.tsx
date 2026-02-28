'use client'

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
}

export function ChartSection({ overview, isLoading, formatCurrency }: ChartSectionProps) {
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
        ? 'Hourly'
        : overview?.period.chartGrouping === 'daily'
          ? 'Daily'
          : overview?.period.chartGrouping === 'weekly'
            ? 'Weekly'
            : 'Monthly'

    return (
      <AreaChart
        data={overview!.chartData}
        series={[
          {
            dataKey: 'sales',
            name: 'Sales',
            color: 'var(--color-primary)',
          },
          {
            dataKey: 'purchases',
            name: 'Purchases',
            color: 'var(--color-chart-2)',
          },
        ]}
        title="Sales vs Purchases"
        subtitle={`${groupingLabel} breakdown`}
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
        title="No transaction data yet"
        description="Sales and purchase trends will appear here as you record transactions"
        compact
      />
    </Card>
  )
}
