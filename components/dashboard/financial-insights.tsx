'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { Progress } from '@ui/components/progress'
import EmptyState from '@ui/components/EmptyState'
import { BarChart3 } from 'lucide-react'
import type { DashboardOverview } from '@/services/api'

interface FinancialInsightsProps {
  overview?: DashboardOverview
  isLoading: boolean
  formatCurrency: (v: number) => string
}

export function FinancialInsights({ overview, isLoading, formatCurrency }: FinancialInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Financial Insights
          </CardTitle>
          <CardDescription>Period performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-5 w-[140px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Financial Insights
          </CardTitle>
          <CardDescription>Period performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Financial insights will appear with transactions"
            compact
          />
        </CardContent>
      </Card>
    )
  }

  const grossProfit = overview.grossProfit
  const collectionRate = overview.sales.total > 0
    ? Math.round((overview.sales.paid / overview.sales.total) * 100)
    : 0
  const avgOrderValue = overview.sales.count > 0
    ? overview.sales.total / overview.sales.count
    : 0
  const avgPurchaseValue = overview.purchases.count > 0
    ? overview.purchases.total / overview.purchases.count
    : 0
  const paymentRate = overview.purchases.total > 0
    ? Math.round((overview.purchases.paid / overview.purchases.total) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Financial Insights
        </CardTitle>
        <CardDescription>Period performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gross Profit */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className="text-base font-bold">{formatCurrency(grossProfit)}</p>
            </div>
            <Badge variant={grossProfit >= 0 ? 'default' : 'destructive'} className="text-[10px]">
              {grossProfit >= 0 ? '+' : ''}{overview.sales.total > 0 ? Math.round((grossProfit / overview.sales.total) * 100) : 0}% margin
            </Badge>
          </div>

          {/* Avg Order Value */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Avg Sale Value</p>
              <p className="text-base font-bold">{formatCurrency(avgOrderValue)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.sales.count} sale{overview.sales.count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Avg Purchase Value */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Avg Purchase Value</p>
              <p className="text-base font-bold">{formatCurrency(avgPurchaseValue)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.purchases.count} order{overview.purchases.count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Sales Collection Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Sales Collection</p>
              <span className="text-xs font-semibold tabular-nums">{collectionRate}%</span>
            </div>
            <Progress value={collectionRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {formatCurrency(overview.sales.paid)} collected of {formatCurrency(overview.sales.total)}
            </p>
          </div>

          {/* Purchase Payment Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Purchase Payment</p>
              <span className="text-xs font-semibold tabular-nums">{paymentRate}%</span>
            </div>
            <Progress value={paymentRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {formatCurrency(overview.purchases.paid)} paid of {formatCurrency(overview.purchases.total)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
