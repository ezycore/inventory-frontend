'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
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
  const t = useTranslations('dashboard.financial')
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            compact
          />
        </CardContent>
      </Card>
    )
  }

  // Gross profit is headlined in the KPI row, not repeated here — this panel is
  // the rates and averages behind those headlines.
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
          {t('title')}
        </CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Avg Order Value */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('avgSaleValue')}</p>
              <p className="text-base font-bold">{formatCurrency(avgOrderValue)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('salesCount', { count: overview.sales.count })}
            </p>
          </div>

          {/* Avg Purchase Value */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('avgPurchaseValue')}</p>
              <p className="text-base font-bold">{formatCurrency(avgPurchaseValue)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('purchasesCount', { count: overview.purchases.count })}
            </p>
          </div>

          {/* Sales Collection Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t('salesCollection')}</p>
              <span className="text-xs font-semibold tabular-nums">{collectionRate}%</span>
            </div>
            <Progress value={collectionRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {t('collectedOfTotal', { collected: formatCurrency(overview.sales.paid), total: formatCurrency(overview.sales.total) })}
            </p>
          </div>

          {/* Purchase Payment Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t('purchasePayment')}</p>
              <span className="text-xs font-semibold tabular-nums">{paymentRate}%</span>
            </div>
            <Progress value={paymentRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {t('paidOfTotal', { paid: formatCurrency(overview.purchases.paid), total: formatCurrency(overview.purchases.total) })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
