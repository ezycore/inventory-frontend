'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { OrdersReportData } from '@/services/api/modules/reports/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { calcPeriodChange } from '@/utils/period-change'

/**
 * The four headline figures, on the order clock.
 *
 * Two of them exist because a plain number would be a lie here:
 *
 * - **`placed` is the revenue-eligible count**, while `funnel.placed` is the whole
 *   intake. They differ whenever anything was cancelled or rejected, so the tile
 *   says so rather than leaving a merchant to find two "orders placed" numbers on
 *   one page and no explanation.
 * - **`avgOrderValue` is `null`, not 0, for an empty period.** "The average order
 *   was ৳0" is not a true sentence about a week with no orders.
 */
export function OrderSummaryTiles({
  data,
  formatCurrency,
}: {
  data: OrdersReportData
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.orders')
  const tCommon = useTranslations('reports')

  const valueChange = calcPeriodChange(data.summary.netValue, data.summary.previousNetValue)
  const countChange = calcPeriodChange(data.summary.placed, data.summary.previousPlaced)

  return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('placed')}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.placed}</div>
            {/* The cohort is the bigger number whenever anything was turned
                away, and a merchant will otherwise ask why the two differ. */}
            {data.funnel.placed !== data.summary.placed && (
              <p className="text-xs text-muted-foreground">
                {t('ofCohort', { total: data.funnel.placed })}
              </p>
            )}
            {countChange && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {countChange.direction === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                {tCommon('vsPreviousPeriod', { value: countChange.value })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('netValue')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.netValue)}
            </div>
            {data.summary.discounts > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('afterDiscounts', {
                  amount: formatCurrency(data.summary.discounts),
                })}
              </p>
            )}
            {valueChange && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {valueChange.direction === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                {tCommon('vsPreviousPeriod', { value: valueChange.value })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('avgOrderValue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Null, not 0: "the average order was ৳0" is not a true sentence
                about a period with no orders. */}
            <div className="text-2xl font-bold">
              {data.summary.avgOrderValue === null
                ? '—'
                : formatCurrency(data.summary.avgOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">{t('avgBasis')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('outstanding')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.outstanding)}
            </div>
            <p className="text-xs text-muted-foreground">{t('outstandingNote')}</p>
          </CardContent>
        </Card>
      </div>
  )
}
