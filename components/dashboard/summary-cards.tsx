'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Card } from '@ui/components/card'
import { cn } from '@ui/lib/utils'
import type { DashboardOverview } from '@/services/api'
import { useAuthStore } from '@/services/stores/use-auth-store'
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

  // A workspace that keeps no stock has no stock value: `overview.inventory`
  // counts only ACTIVE rows and the ghost rows are inactive, so the tile
  // resolves to a confident "৳0 / 0 items in stock" — a statement about an empty
  // warehouse rather than about a business that has none.
  const stockTracked = overview.stockTracked !== false
  // Payable is a supplier balance. Without purchasing there are no supplier
  // dues to accrue, so the tile is not "৳0 this period" — it can never be
  // anything else (QA-C1). Receivable stays at every tier: an uncollected COD
  // order books a real `dueAmount`.
  const purchasesTracked = overview.purchasesTracked !== false
  // The counter half of the split needs the POS — `sales` is the counter
  // capability, not the sales ledger (see the note at the top of `navItem.ts`).
  // Without it every sale is online by construction, so "100% online · Counter
  // ৳0.00" reports a mix that has no other possible value (QA-N3).
  //
  // Read from the org rather than the overview because the overview has no
  // `salesTracked` flag; `pos.total` alone cannot distinguish "no counter" from
  // "a quiet counter", and a shop that later switches the POS on would keep the
  // card hidden until its first counter sale.
  const posEnabled = useAuthStore(
    (state) => state.user?.organization?.features?.sales !== false,
  )
  const channelMixMeaningful = posEnabled

  // Count what actually renders rather than deriving the track from one flag —
  // three independent gates cannot be expressed as "four or three".
  const cardCount =
    1 + (purchasesTracked ? 1 : 0) + (stockTracked ? 1 : 0) + (channelMixMeaningful ? 1 : 0)

  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 sm:grid-cols-2',
        cardCount >= 4
          ? 'lg:grid-cols-4'
          : cardCount === 3
            ? 'lg:grid-cols-3'
            : cardCount === 2
              ? 'lg:grid-cols-2'
              // Receivable can end up alone — a storefront-only shop with no
              // POS has no payable, no stock value and no channel mix. A
              // two-wide track then parked it beside an empty column (QA-R3).
              : 'lg:grid-cols-1',
      )}
    >
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
      {purchasesTracked && (
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
      )}
      {stockTracked && (
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
      )}
      {channelMixMeaningful && (
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
      )}
    </div>
  )
}
