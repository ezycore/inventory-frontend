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
  /**
   * Whether this business buys from suppliers — read off the composed block list
   * by the caller, not from a flag on the payload. Two of the four rows here are
   * purchase-side; for a merchant who buys from nobody they are not "zero this
   * period" but permanently undefined, and a 0% bar reads as a shop failing to
   * pay anyone.
   */
  showPurchases: boolean
}

export function FinancialInsights({
  overview,
  isLoading,
  formatCurrency,
  showPurchases,
}: FinancialInsightsProps) {
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
  // the rates and averages behind those headlines. Which means they have to be
  // the SAME kind of number: both rates below read net of refunds, because the
  // revenue tile they sit under does.
  /**
   * The COUNTER ledger's net revenue, not the page headline.
   *
   * `netRevenue` above combines both channels since P2, while every figure in
   * this panel — `sales.paid`, `sales.count` — is the Sale ledger's counter half.
   * Dividing one by the other understates the collection rate by however much
   * the shop sells online, and reports an average "sale" value over a total that
   * includes orders no Sale in that count represents.
   *
   * Derived rather than sent: `returns` is already counter-filtered server-side,
   * so this is the same arithmetic the service does for `channelMix.counter`.
   */
  const netRevenue =
    (overview.sales?.total ?? 0) -
    (overview.sales?.discounts ?? 0) -
    (overview.returns?.refund ?? 0)

  // Collected against what is actually owed. On the gross total a fully-refunded
  // order stayed in the denominator, so a shop that had collected everything it
  // was still owed read 7% — with a progress bar implying the refunded ৳18,850
  // was outstanding (QA-N9).
  //
  // Derived as "owed less still owing" rather than read off `sales.paid`, which
  // is the GROSS figure: against a net denominator it printed the contradiction
  // "৳81,847.26 collected of ৳77,662.82" and leaned on the clamp below to keep
  // the percentage sane. `netRevenue - due` also stays right when the returned
  // sale was on credit, where the refund never touched `paid` at all.
  const collected = Math.max(0, netRevenue - (overview.sales?.due ?? 0))

  // Clamped at 100 all the same: a sale paid and then refunded in cash leaves
  // money in hand against a denominator that has dropped, and a collection rate
  // above 100% describes nothing a merchant can act on.
  const collectionRate = netRevenue > 0
    ? Math.min(100, Math.round((collected / netRevenue) * 100))
    : 0
  // Net revenue over a GROSS count — settled, and settled twice.
  //
  // A later review asked for the denominator to drop fully-returned orders
  // (net ÷ orders that stuck). Rejected, for two reasons that outlast the
  // example that prompted it:
  //
  //   1. The count is PRINTED beside this value. "৳1,450" next to "3 sales" is
  //      internally inconsistent in a way "৳966.67" next to "3 sales" is not,
  //      so that change is really two changes, and the second one relabels the
  //      tile into a different metric.
  //   2. "Orders that were not returned" has no definition under PARTIAL
  //      returns, which are the common case. Any cutoff — 100% returned? 80%? —
  //      is arbitrary, and an arbitrary denominator is worse than a plain one.
  //
  // What this answers is "what did an average order bring in", counting an
  // order that brought in nothing as exactly that. Do not quietly switch it.
  const avgOrderValue = (overview.sales?.count ?? 0) > 0
    ? netRevenue / (overview.sales?.count ?? 0)
    : 0
  const avgPurchaseValue = (overview.purchases?.count ?? 0) > 0
    ? (overview.purchases?.total ?? 0) / (overview.purchases?.count ?? 0)
    : 0
  const paymentRate = (overview.purchases?.total ?? 0) > 0
    ? Math.round(((overview.purchases?.paid ?? 0) / (overview.purchases?.total ?? 0)) * 100)
    : 0
  const purchasesTracked = showPurchases

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
              {t('salesCount', { count: (overview.sales?.count ?? 0) })}
            </p>
          </div>

          {/* Avg Purchase Value */}
          {purchasesTracked && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t('avgPurchaseValue')}</p>
                <p className="text-base font-bold">{formatCurrency(avgPurchaseValue)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('purchasesCount', { count: (overview.purchases?.count ?? 0) })}
              </p>
            </div>
          )}

          {/* Sales Collection Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t('salesCollection')}</p>
              <span className="text-xs font-semibold tabular-nums">{collectionRate}%</span>
            </div>
            <Progress value={collectionRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {t('collectedOfTotal', { collected: formatCurrency(collected), total: formatCurrency(netRevenue) })}
            </p>
          </div>

          {/* Purchase Payment Rate */}
          {purchasesTracked && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{t('purchasePayment')}</p>
                <span className="text-xs font-semibold tabular-nums">{paymentRate}%</span>
              </div>
              <Progress value={paymentRate} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">
                {t('paidOfTotal', { paid: formatCurrency((overview.purchases?.paid ?? 0)), total: formatCurrency((overview.purchases?.total ?? 0)) })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
