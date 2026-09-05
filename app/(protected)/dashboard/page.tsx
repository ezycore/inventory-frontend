'use client'
// coding-standard: maintained

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import StatsCard, { type StatData } from '@ui/components/StatsCard'
import {
  useDashboardOverview,
  useStockMovements,
  type DashboardPeriod,
  type DashboardOverviewParams,
} from '@/services/api'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { isFeatureEnabled } from '@/lib/feature-utils'
import { useCurrency } from '@/lib/currency'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  ArrowDownToLine,
} from 'lucide-react'
import { calcChange } from '@/components/dashboard/helpers'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { PeriodFilter } from '@/components/dashboard/period-filter'
import { ChartSection } from '@/components/dashboard/chart-section'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { TopSoldItems } from '@/components/dashboard/top-sold-items'
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts'
import { ActivitySection } from '@/components/dashboard/activity-section'
import { FinancialInsights } from '@/components/dashboard/financial-insights'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { ReportsRestricted } from '@/components/dashboard/reports-restricted'

export default function DashboardPage() {
  const t = useTranslations('dashboard.kpi')
  const tGreeting = useTranslations('dashboard.greeting')
  const user = useAuthStore((s) => s.user)
  const timezone = user?.organization?.timezone
  const { format: formatCurrency } = useCurrency()

  // ── Period state ──
  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Only build params when valid (custom needs both dates)
  const isCustomValid = period !== 'custom' || (!!customStart && !!customEnd)

  // The whole dashboard aggregate is gated on `reports.view` (dashboard.route.ts).
  // Without it every panel below rendered ৳0.00 and "No transaction data yet" off
  // a silent 403 — which is not a missing panel, it is a wrong number: a cashier
  // reads it as "the shop sold nothing today". Skip the fetch and say so instead.
  const canViewReports = !!user?.permissions?.includes('reports.view')

  const overviewParams = useMemo<DashboardOverviewParams | undefined>(() => {
    if (!isCustomValid || !canViewReports) return undefined
    const params: DashboardOverviewParams = {
      period,
      weekStartDay: 1, // Monday default
    }
    if (period === 'custom' && customStart && customEnd) {
      params.startDate = customStart
      params.endDate = customEnd
    }
    return params
  }, [period, customStart, customEnd, isCustomValid, canViewReports])

  const { data: overviewData, isFetching: overviewLoading } = useDashboardOverview(overviewParams)
  const { data: stockMovements, isLoading: movementsLoading } =
    useStockMovements({ page: 1, limit: 4 })

  const overview = overviewData?.data
  const firstName = user?.firstName || tGreeting('fallbackName')

  // ── KPI Stats (period-based) ──
  // Both sides of the trend are NET. Comparing this period's revenue after
  // refunds against last period's before them invents a swing out of nothing —
  // a quiet month following a month with one big refund reads as growth.
  const salesChange = overview
    ? calcChange(overview.netRevenue, overview.previousNetRevenue)
    : null
  const purchasesChange = overview ? calcChange(overview.purchases.total, overview.purchases.previousTotal) : null
  // Gross profit headlines here rather than inside Financial Insights: it is the
  // number a merchant opens the page for. The panel keeps the rates and averages.
  const grossProfit = overview?.grossProfit || 0
  // Margin is of NET revenue — `grossProfit` already has returns taken off both
  // revenue and COGS, so dividing by the gross `sales.total` understates it and
  // disagrees with the Profit & Loss report for the same period.
  //
  // Which is why the revenue tile beside it is net too. It was not: a workspace
  // with two orders, one refused in full, printed "৳20,300" next to a 38% margin
  // computed on ৳1,450 (QA-N9). The refund is disclosed under the tile rather
  // than netted away silently — for cash-on-delivery trade a refused parcel is a
  // KPI, and a merchant whose revenue halved needs the page to say why.
  const netRevenue = overview?.netRevenue ?? 0
  const returnedAmount = overview?.returns.refund ?? 0
  const grossMargin = netRevenue > 0
    ? Math.round((grossProfit / netRevenue) * 100)
    : 0

  // Degrade rather than print a structurally-zero figure. A merchant who does
  // not buy from suppliers has no purchase cost by construction, so the tile
  // would read "৳0" with a flat trend forever — a number that looks like a
  // reporting bug rather than an accurate description of their business. The
  // backend still returns the figures (history stays readable); this decides
  // whether they are shown.
  const purchasesTracked = overview?.purchasesTracked !== false
  // Same rule for the stock half. A business that never held stock has no low
  // stock and nothing out of stock — its inventory rows are inactive link
  // records — so the panel would render a permanently empty "all good" state,
  // which is a reassurance about a question the merchant never asked.
  const stockTracked = overview?.stockTracked !== false
  const storefrontEnabled =
    isFeatureEnabled(user?.organization?.features, 'storefront') &&
    (user?.permissions?.includes('storefront.orders.view') ?? false)

  const kpiStats: StatData[] = [
    {
      label: t('salesRevenue'),
      value: formatCurrency(netRevenue),
      description: returnedAmount > 0
        ? t('afterReturns', { amount: formatCurrency(returnedAmount) })
        : undefined,
      icon: DollarSign,
      variant: 'success',
      trend: salesChange && salesChange.direction !== 'neutral'
        ? {
            value: `${salesChange.value}%`,
            direction: salesChange.direction,
            label: t('vsPrevious'),
          }
        : undefined,
    },
    ...(purchasesTracked
      ? [
          {
            label: t('purchaseCost'),
            value: formatCurrency(overview?.purchases.total || 0),
            icon: ArrowDownToLine,
            variant: 'info' as const,
            trend:
              purchasesChange && purchasesChange.direction !== 'neutral'
                ? {
                    value: `${purchasesChange.value}%`,
                    direction: purchasesChange.direction,
                    label: t('vsPrevious'),
                  }
                : undefined,
          },
        ]
      : []),
    {
      label: t('grossProfit'),
      value: formatCurrency(grossProfit),
      icon: TrendingUp,
      variant: grossProfit >= 0 ? 'success' : 'warning',
      description: overview ? t('marginOfSales', { margin: grossMargin }) : undefined,
    },
    {
      label: t('transactions'),
      // The count follows the same rule as the tile above: adding a purchase
      // count that is always zero makes the total read as "sales, but stated
      // oddly", and the breakdown line beneath it names a half the merchant
      // does not have.
      value: purchasesTracked
        ? (overview?.sales.count || 0) + (overview?.purchases.count || 0)
        : overview?.sales.count || 0,
      icon: ShoppingCart,
      variant: 'primary',
      description:
        overview && purchasesTracked
          ? t('salesPurchaseCount', {
              sales: overview.sales.count,
              purchases: overview.purchases.count,
            })
          : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader firstName={firstName} timezone={timezone} />

      {canViewReports ? (
        <>
          <PeriodFilter
            period={period}
            setPeriod={setPeriod}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            periodInfo={overview?.period}
          />

          {/* Derived, never a fixed maximum. `kpiStats` drops the Purchase Cost
              tile for a merchant who buys from nobody, and a hardcoded 4-wide
              track then left a hole where it used to be (QA-R3). The Products
              page already sizes its row this way. */}
          <StatsCard
            data={kpiStats}
            isLoading={overviewLoading}
            columns={{ default: 2, lg: kpiStats.length }}
          />

          <ChartSection
            overview={overview}
            isLoading={overviewLoading}
            formatCurrency={formatCurrency}
          />

          {overview && (
            <SummaryCards overview={overview} formatCurrency={formatCurrency} />
          )}

          {/* Drops to a single column when the stock panel is gone, rather than
              leaving a half-width card beside dead space. */}
          <div
            className={`grid gap-6 grid-cols-1 ${
              stockTracked ? "lg:grid-cols-2" : ""
            }`}
          >
            <TopSoldItems
              items={overview?.topSoldItems}
              isLoading={overviewLoading}
              formatCurrency={formatCurrency}
            />
            {stockTracked && (
              <LowStockAlerts
                lowStock={overview?.lowStock}
                isLoading={overviewLoading}
              />
            )}
          </div>
        </>
      ) : (
        <ReportsRestricted />
      )}

      <div
        className={
          canViewReports && stockTracked
            ? 'grid gap-6 grid-cols-1 lg:grid-cols-2'
            : 'grid gap-6 grid-cols-1'
        }
      >
        {/* Stock movements are gated on `stock.view`, which every role that can
            reach this page already has — so PERMISSION keeps this panel for
            everyone.

            Stock tracking does not. An untracked sale writes no StockMovement
            by design — that is what keeps the movement ledger honest, every row
            describing stock that really moved — so this panel is permanently
            empty for such a workspace, under a heading and a "View all" button
            pointing at a screen the route guard now locks. Empty reads as "no
            activity yet"; the truth is that there is no such thing here. */}
        {stockTracked && (
        <ActivitySection
          stockMovements={stockMovements}
          isLoading={movementsLoading}
        />
        )}
        {canViewReports && (
          <FinancialInsights
            overview={overview}
            isLoading={overviewLoading}
            formatCurrency={formatCurrency}
          />
        )}
        {/* Fills the space the stock panels leave. A storefront merchant loses
            the movement ledger, the low-stock list, the purchase chart and the
            payable tile — and the page that remained said nothing about the
            thing their business actually does (QA-R3). Orders are that thing.
            Shown to every storefront merchant, stocked or not: a shop with both
            channels still wants its online queue on the home screen. */}
        {storefrontEnabled && <RecentOrders />}
      </div>

      <QuickActions />
    </div>
  )
}
