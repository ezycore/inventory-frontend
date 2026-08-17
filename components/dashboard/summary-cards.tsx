'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Card } from '@ui/components/card'
import type { DashboardOverview } from '@/services/api'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Warehouse,
  Globe,
} from 'lucide-react'

interface SummaryCardsProps {
  overview: DashboardOverview
  formatCurrency: (v: number) => string
}

/**
 * The second stat row: two balances, stock value, and the sales channel mix.
 *
 * Deliberately holds nothing the KPI row above already prints. Receivable and
 * payable are also the only figures on the page that ignore the period filter —
 * a balance is not a period quantity, which is why their sub-lines say so.
 */
export function SummaryCards({ overview, formatCurrency }: SummaryCardsProps) {
  const t = useTranslations('dashboard.summary')

  const { pos, online } = overview.sales.byChannel
  const channelTotal = pos.total + online.total
  const onlineShare = channelTotal > 0
    ? Math.round((online.total / channelTotal) * 100)
    : 0

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <ArrowDownLeft className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('receivable')}</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.outstanding.receivable)}
            </p>
            <p className="text-xs text-muted-foreground">{t('owedByCustomers')}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-chart-2/10 p-2.5">
            <ArrowUpRight className="h-5 w-5 text-chart-2" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('payable')}</p>
            <p className="text-lg font-bold truncate">
              {formatCurrency(overview.outstanding.payable)}
            </p>
            <p className="text-xs text-muted-foreground">{t('owedToSuppliers')}</p>
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
            <Globe className="h-5 w-5 text-chart-1" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('salesChannels')}</p>
            <p className="text-lg font-bold truncate">
              {t('shareOnline', { share: onlineShare })}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {t('onlineCounterSplit', {
                online: formatCurrency(online.total),
                counter: formatCurrency(pos.total),
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
