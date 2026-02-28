'use client'

import { useMemo, useState } from 'react'
import StatsCard, { type StatData } from '@ui/components/StatsCard'
import {
  useDashboardOverview,
  useStockMovements,
  type DashboardPeriod,
  type DashboardOverviewParams,
} from '@/services/api'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { useCurrency } from '@/lib/currency'
import {
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  ArrowDownToLine,
} from 'lucide-react'
import { calcChange } from './helpers'
import { DashboardHeader } from './dashboard-header'
import { PeriodFilter } from './period-filter'
import { SummaryCards } from './summary-cards'
import { ChartSection } from './chart-section'
import { TopSoldItems } from './top-sold-items'
import { LowStockAlerts } from './low-stock-alerts'
import { FinancialInsights } from './financial-insights'
import { ActivitySection } from './activity-section'
import { QuickActions } from './quick-actions'

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const timezone = user?.organization?.timezone
  const { format: formatCurrency } = useCurrency()

  // ── Period state ──
  const [period, setPeriod] = useState<DashboardPeriod>('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Only build params when valid (custom needs both dates)
  const isCustomValid = period !== 'custom' || (!!customStart && !!customEnd)

  const overviewParams = useMemo<DashboardOverviewParams | undefined>(() => {
    if (!isCustomValid) return undefined
    const params: DashboardOverviewParams = {
      period,
      weekStartDay: 1, // Monday default
    }
    if (period === 'custom' && customStart && customEnd) {
      params.startDate = customStart
      params.endDate = customEnd
    }
    return params
  }, [period, customStart, customEnd, isCustomValid])

  const { data: overviewData, isLoading: overviewLoading } = useDashboardOverview(overviewParams)
  const { data: stockMovements, isLoading: movementsLoading } =
    useStockMovements({ page: 1, limit: 4 })

  const overview = overviewData?.data
  const firstName = user?.firstName || 'there'

  // ── KPI Stats (period-based) ──
  const salesChange = overview ? calcChange(overview.sales.total, overview.sales.previousTotal) : null
  const purchasesChange = overview ? calcChange(overview.purchases.total, overview.purchases.previousTotal) : null
  const dueTotal = (overview?.sales.due || 0) + (overview?.purchases.due || 0)

  const kpiStats: StatData[] = [
    {
      label: 'Sales Revenue',
      value: formatCurrency(overview?.sales.total || 0),
      icon: DollarSign,
      variant: 'success',
      trend: salesChange && salesChange.direction !== 'neutral'
        ? {
            value: `${salesChange.value}%`,
            direction: salesChange.direction,
            label: 'vs previous',
          }
        : undefined,
    },
    {
      label: 'Purchase Cost',
      value: formatCurrency(overview?.purchases.total || 0),
      icon: ArrowDownToLine,
      variant: 'info',
      trend: purchasesChange && purchasesChange.direction !== 'neutral'
        ? {
            value: `${purchasesChange.value}%`,
            direction: purchasesChange.direction,
            label: 'vs previous',
          }
        : undefined,
    },
    {
      label: 'Total Due',
      value: formatCurrency(dueTotal),
      icon: AlertTriangle,
      variant: dueTotal > 0 ? 'warning' : 'success',
      description: overview
        ? `Sales ${formatCurrency(overview.sales.due)} · Purchase ${formatCurrency(overview.purchases.due)}`
        : undefined,
    },
    {
      label: 'Transactions',
      value: (overview?.sales.count || 0) + (overview?.purchases.count || 0),
      icon: ShoppingCart,
      variant: 'primary',
      description: overview
        ? `${overview.sales.count} sales · ${overview.purchases.count} purchases`
        : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader firstName={firstName} timezone={timezone} />

      <PeriodFilter
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        periodInfo={overview?.period}
      />

      <StatsCard
        data={kpiStats}
        isLoading={overviewLoading}
        columns={{ default: 2, lg: 4 }}
      />

      <ChartSection
        overview={overview}
        isLoading={overviewLoading}
        formatCurrency={formatCurrency}
      />

      {overview && (
        <SummaryCards overview={overview} formatCurrency={formatCurrency} />
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <TopSoldItems
          items={overview?.topSoldItems}
          isLoading={overviewLoading}
          formatCurrency={formatCurrency}
        />
        <LowStockAlerts
          lowStock={overview?.lowStock}
          isLoading={overviewLoading}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ActivitySection
          stockMovements={stockMovements}
          isLoading={movementsLoading}
        />
        <FinancialInsights
          overview={overview}
          isLoading={overviewLoading}
          formatCurrency={formatCurrency}
        />
      </div>

      <QuickActions />
    </div>
  )
}
