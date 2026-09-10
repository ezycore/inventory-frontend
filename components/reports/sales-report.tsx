'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useSalesReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { PeriodFilter } from '@/components/shared/period-filter'
import { TopCombosCard } from './top-combos-card'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

function calcChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return { value: 0, direction: 'neutral' as const }
  if (previous === 0) return { value: 100, direction: 'up' as const }
  const pct = ((current - previous) / previous) * 100
  return {
    value: Math.abs(Math.round(pct)),
    direction: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('neutral' as const),
  }
}

export function SalesReport() {
  const t = useTranslations('reports.sales')
  const tCommon = useTranslations('reports')
  const tEmpty = useTranslations('common.empty')
  const tPaymentStatus = useTranslations('common.paymentStatus')
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useSalesReport(params)
  const { format: formatCurrency } = useCurrency()

  // Both sides net, or a quiet period following one with a big refund reads as
  // growth. Same rule as the dashboard's revenue trend.
  const salesChange = data
    ? calcChange(data.summary.netSales, data.summary.previousNetSales)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <PeriodFilter
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('totalSales')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {/* Net, and the refund disclosed beneath it. Gross put a fully
                    refunded order's full value in this tile while Paid and Due
                    both excluded it, so the number matched neither (QA-R1). */}
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.netSales)}
                </div>
                {data.summary.returns.refund > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('afterReturns', {
                      amount: formatCurrency(data.summary.returns.refund),
                    })}
                  </p>
                )}
                {salesChange && salesChange.direction !== 'neutral' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {salesChange.direction === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    {tCommon('vsPreviousPeriod', { value: salesChange.value })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('grossProfit')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.grossProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {/* Margin OF net revenue: `grossProfit` already has returns
                      off both legs, so a gross denominator understates it and
                      disagrees with the P&L for the same period. */}
                  {t('margin', {
                    value:
                      data.summary.netSales > 0
                        ? Math.round((data.summary.grossProfit / data.summary.netSales) * 100)
                        : 0,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('orders')}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.count}</div>
                <p className="text-xs text-muted-foreground">
                  {t('itemsSold', { count: data.summary.totalItems })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('totalDue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary.totalDue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('paid', { amount: formatCurrency(data.summary.totalPaid) })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Data */}
          {data.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('salesTrend')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.chartData.map((point, i) => {
                    const maxVal = Math.max(...data.chartData.map((d) => d.total))
                    const width = maxVal > 0 ? (point.total / maxVal) * 100 : 0
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-24 shrink-0 text-muted-foreground text-xs">
                          {point.label}
                        </span>
                        <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-sm"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-medium text-xs">
                          {formatCurrency(point.total)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products & Top Customers */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('topSellingProducts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noSalesData')}</p>
                  ) : (
                    data.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{p.productName}</span>
                          <span className="ml-2 text-muted-foreground">×{p.totalQuantity}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(p.totalRevenue)}</span>
                          <span className="ml-2 text-xs text-green-600">
                            +{formatCurrency(p.profit)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('topCustomers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noCustomerData')}</p>
                  ) : (
                    data.topCustomers.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{c.customerName}</span>
                          <span className="ml-2 text-muted-foreground">
                            {t('ordersCount', { count: c.orderCount })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(c.totalSpent)}</span>
                          {c.totalDue > 0 && (
                            <span className="ml-2 text-xs text-red-500">
                              {t('due', { amount: formatCurrency(c.totalDue) })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          {data.statusBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('paymentStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.statusBreakdown.map((s, i) => {
                    const colors: Record<string, string> = {
                      paid: 'text-green-600',
                      partial: 'text-yellow-600',
                      due: 'text-red-600',
                    }
                    return (
                      <div key={i} className="text-center">
                        <div className={`text-xl font-bold capitalize ${colors[s.status] || ''}`}>
                          {s.count}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{tPaymentStatus.has(s.status) ? tPaymentStatus(s.status) : s.status}</p>
                        <p className="text-sm font-medium">{formatCurrency(s.total)}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Combo-level rollup (self-hides when combo feature off / none sold). */}
          <TopCombosCard params={params} formatCurrency={formatCurrency} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
      )}
    </div>
  )
}
