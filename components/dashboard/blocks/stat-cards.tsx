'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Card } from '@ui/components/card'
import { cn } from '@ui/lib/utils'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Globe,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardBlockContext } from './context'

/**
 * The small summary cards — one component per block.
 *
 * These were four branches inside one `SummaryCards` component, each wrapped in
 * its own ad-hoc flag (`purchasesTracked`, `stockTracked`, `posEnabled`). The
 * flags are gone: the block registry decides which of these the server names,
 * and a card that arrives simply renders.
 *
 * Receivable and payable are the only figures on the dashboard that ignore the
 * period filter — a balance is not a period quantity, which is why their
 * sub-lines say so.
 */

interface StatCardShellProps {
  icon: LucideIcon
  /** Tint of the icon's tile, e.g. `bg-primary/10 text-primary`. */
  tone: string
  label: string
  value: string
  hint: string
}

function StatCardShell({ icon: Icon, tone, label, value, hint }: StatCardShellProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2.5', tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{hint}</p>
        </div>
      </div>
    </Card>
  )
}

export function ReceivablesCard({ overview, formatCurrency }: DashboardBlockContext) {
  const t = useTranslations('dashboard.summary')
  if (!overview) return null
  /**
   * Customers only. The server counts dues on counter sales alone and admits
   * this block only with POS (or POS history); what a COURIER is holding is on
   * the COD tile ("Coming from couriers"). It used to read "With customers and
   * couriers" and double-count that money on storefront shops.
   */
  return (
    <StatCardShell
      icon={ArrowDownLeft}
      tone="bg-primary/10 text-primary"
      label={t('receivable')}
      value={formatCurrency(overview.outstanding?.receivable ?? 0)}
      hint={t('owedByCustomers')}
    />
  )
}

export function PayablesCard({ overview, formatCurrency }: DashboardBlockContext) {
  const t = useTranslations('dashboard.summary')
  if (!overview) return null
  return (
    <StatCardShell
      icon={ArrowUpRight}
      tone="bg-chart-2/10 text-chart-2"
      label={t('payable')}
      value={formatCurrency(overview.outstanding?.payable ?? 0)}
      hint={t('owedToSuppliers')}
    />
  )
}

export function StockValueCard({ overview, formatCurrency }: DashboardBlockContext) {
  const t = useTranslations('dashboard.summary')
  if (!overview) return null
  return (
    <StatCardShell
      icon={Warehouse}
      tone="bg-chart-4/10 text-chart-4"
      label={t('inventoryValueCost')}
      value={formatCurrency(overview.inventory?.totalValue ?? 0)}
      hint={t('itemsInStock', {
        count: (overview.inventory?.totalItems ?? 0).toLocaleString(),
      })}
    />
  )
}

export function ChannelMixCard({ overview, formatCurrency }: DashboardBlockContext) {
  const t = useTranslations('dashboard.summary')
  if (!overview) return null

  /**
   * Both halves are NET and each is on its own clock — counter sales when they
   * rang, online orders on the day they were placed — so the two add back to the
   * revenue headline above. The retired `sales.byChannel` read "online" off the
   * Sale ledger, which dated that slice to dispatch while the total beside it
   * was dated to the order; they could not agree by construction.
   */
  const { counter, online } = overview.channelMix ?? { counter: 0, online: 0 }
  const channelTotal = counter + online
  const onlineShare =
    channelTotal > 0 ? Math.round((online / channelTotal) * 100) : 0

  return (
    <StatCardShell
      icon={Globe}
      tone="bg-chart-1/10 text-chart-1"
      label={t('salesChannels')}
      value={t('shareOnline', { share: onlineShare })}
      hint={t('onlineCounterSplit', {
        online: formatCurrency(online),
        counter: formatCurrency(counter),
      })}
    />
  )
}
