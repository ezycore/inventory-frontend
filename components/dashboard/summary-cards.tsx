'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Card } from '@ui/components/card'
import type { DashboardOverview } from '@/services/api'
import {
  DollarSign,
  ArrowDownToLine,
  Warehouse,
  TrendingUp,
} from 'lucide-react'

interface SummaryCardsProps {
  overview: DashboardOverview
  formatCurrency: (v: number) => string
}

export function SummaryCards({ overview, formatCurrency }: SummaryCardsProps) {
  const t = useTranslations('dashboard.summary')
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('periodSales')}</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.sales.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('transactionsCollected', { count: overview.sales.count, amount: formatCurrency(overview.sales.paid) })}
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-chart-2/10 p-2.5">
            <ArrowDownToLine className="h-5 w-5 text-chart-2" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('periodPurchases')}</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.purchases.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('ordersPaid', { count: overview.purchases.count, amount: formatCurrency(overview.purchases.paid) })}
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-chart-4/10 p-2.5">
            <Warehouse className="h-5 w-5 text-chart-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('inventoryValueCost')}</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.inventory.totalValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('itemsInStock', { count: overview.inventory.totalItems.toLocaleString() })}
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-chart-1/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-chart-1" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('periodDue')}</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency((overview.sales.due || 0) + (overview.purchases.due || 0))}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('salesPurchaseDue', { sales: formatCurrency(overview.sales.due), purchase: formatCurrency(overview.purchases.due) })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
