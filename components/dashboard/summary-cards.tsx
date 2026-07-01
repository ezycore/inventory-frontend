'use client'

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
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Period Sales</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.sales.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {overview.sales.count} transaction{overview.sales.count !== 1 ? 's' : ''} · Collected {formatCurrency(overview.sales.paid)}
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
            <p className="text-xs text-muted-foreground">Period Purchases</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.purchases.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {overview.purchases.count} order{overview.purchases.count !== 1 ? 's' : ''} · Paid {formatCurrency(overview.purchases.paid)}
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
            <p className="text-xs text-muted-foreground">Inventory Value (Cost)</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.inventory.totalValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {overview.inventory.totalItems.toLocaleString()} items in stock
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
            <p className="text-xs text-muted-foreground">Period Due</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency((overview.sales.due || 0) + (overview.purchases.due || 0))}
            </p>
            <p className="text-xs text-muted-foreground">
              Sales {formatCurrency(overview.sales.due)} · Purchase {formatCurrency(overview.purchases.due)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
