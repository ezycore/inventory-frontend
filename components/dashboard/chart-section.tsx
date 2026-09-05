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
}

export function ChartSection({ overview, isLoading, formatCurrency }: ChartSectionProps) {
  const t = useTranslations('dashboard.chart')
  const purchasesTracked = overview?.purchasesTracked !== false
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
          {
            dataKey: 'sales',
            name: t('sales'),
            color: 'var(--color-primary)',
          },
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
        title={purchasesTracked ? t('title') : t('salesTitle')}
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
