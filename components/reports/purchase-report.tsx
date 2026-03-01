'use client'

import { usePurchaseReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { ReportPeriodFilter } from './report-period-filter'
import {
  DollarSign,
  ShoppingBag,
  Truck,
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

export function PurchaseReport() {
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = usePurchaseReport(params)
  const { format: formatCurrency } = useCurrency()

  const purchaseChange = data
    ? calcChange(data.summary.totalPurchases, data.summary.previousTotal)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Report</h1>
          <p className="text-sm text-muted-foreground">
            Detailed analysis of purchase orders
          </p>
        </div>
      </div>

      <ReportPeriodFilter
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
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalPurchases)}
                </div>
                {purchaseChange && purchaseChange.direction !== 'neutral' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {purchaseChange.direction === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-green-500" />
                    )}
                    {purchaseChange.value}% vs previous period
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.count}</div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.totalItems} items received
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalPaid)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                <DollarSign className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary.totalDue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Data */}
          {data.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Purchase Trend</CardTitle>
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
                            className="h-full bg-blue-500/80 rounded-sm"
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

          {/* Top Products & Top Suppliers */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Purchased Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No purchase data</p>
                  ) : (
                    data.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{p.productName}</span>
                          <span className="ml-2 text-muted-foreground">×{p.totalQuantity}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(p.totalCost)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Top Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topSuppliers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No supplier data</p>
                  ) : (
                    data.topSuppliers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{s.supplierName}</span>
                          <span className="ml-2 text-muted-foreground">
                            {s.orderCount} orders
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(s.totalAmount)}</span>
                          {s.totalDue > 0 && (
                            <span className="ml-2 text-xs text-red-500">
                              Due: {formatCurrency(s.totalDue)}
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
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.statusBreakdown.map((s, i) => {
                    const colors: Record<string, string> = {
                      received: 'text-green-600',
                      partial: 'text-yellow-600',
                      ordered: 'text-blue-600',
                    }
                    return (
                      <div key={i} className="text-center">
                        <div className={`text-xl font-bold capitalize ${colors[s.status] || ''}`}>
                          {s.count}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{s.status}</p>
                        <p className="text-sm font-medium">{formatCurrency(s.total)}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No data available</p>
      )}
    </div>
  )
}
