'use client'
// coding-standard: maintained

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Info,
  TrendingUp,
} from 'lucide-react'
import { useOrdersReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { PeriodFilter } from '@/components/shared/period-filter'
import { useReportPeriod } from './use-report-period'
import { SalesBreakdownCard } from './sales-breakdown-card'
import { OrderFunnelCard } from './orders/order-funnel-card'
import {
  OrderCourierCard,
  OrderDistrictCard,
  OrderRejectionCard,
  OrderSourceCard,
} from './orders/order-segment-cards'
import { OrderSummaryTiles } from './orders/order-summary-tiles'
import {
  OrderTopCustomersCard,
  OrderTopProductsCard,
} from './orders/order-top-panels'

/**
 * The Orders Report — storefront orders on the day they were PLACED.
 *
 * **The clock line under the title is not decoration.** Every other report on
 * this site reads the Sale ledger, where an online order appears only on the day
 * its parcel left. So this page and the Sales Report give different totals for
 * the same week, both correctly, and a merchant who is not told which is which
 * reads it as the software disagreeing with itself. That is the confusion this
 * whole report was built to end; the sentence is the cheapest part of the fix.
 *
 * Mobile first throughout: one column at phone width, panels widening at `sm`
 * and `lg`. No table goes sideways — the segment cards are row lists.
 */
export function OrdersReport() {
  const t = useTranslations('reports.orders')
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useOrdersReport(params)
  const { format: formatCurrency } = useCurrency()

  /**
   * The margin a client may honestly print.
   *
   * Taken over the known-cost slice only, and the numerator is that same slice —
   * `grossProfit` counts revenue with no cost behind it at full value, so
   * dividing the whole of it by `knownRevenue` mixes scopes. **Any figure over
   * 100% is that mistake coming back.** No known revenue means no number at all.
   */
  const margin = (() => {
    if (!data?.profit) return null
    const { grossProfit, costCoverage } = data.profit
    if (costCoverage.knownRevenue <= 0) return null
    return ((grossProfit - costCoverage.unknownRevenue) / costCoverage.knownRevenue) * 100
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* The clock. Says what this page counts and links to the page that counts
          the other thing, so the two totals are a choice rather than a puzzle. */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          {t('clockNote')}{' '}
          <Link href="/reports/sales" className="font-medium underline underline-offset-2">
            {t('clockLink')}
          </Link>
        </p>
      </div>

      <PeriodFilter
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
          <OrderSummaryTiles data={data} formatCurrency={formatCurrency} />

          {/* Profit — absent entirely for a caller without `costs.view`, because
              the server never computed it. */}
          {data.profit && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('profit.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.profit.grossProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('profit.afterCarriage', {
                      amount: formatCurrency(data.shipping.cost),
                    })}
                  </p>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {margin === null ? '—' : `${margin.toFixed(1)}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('profit.marginBasis')}</p>
                </div>
                {/* The honest caveat, on the page rather than buried in the
                    payload: on a live workspace this was a fifth of revenue, and
                    a margin printed without it is a claim the data cannot support. */}
                {data.profit.costCoverage.unknownRevenue > 0 && (
                  <p className="w-full text-xs text-amber-600">
                    {t('profit.unknownCost', {
                      amount: formatCurrency(data.profit.costCoverage.unknownRevenue),
                      orders: data.profit.costCoverage.uncommittedOrders,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <OrderFunnelCard data={data} />
            <OrderCourierCard data={data} formatCurrency={formatCurrency} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <OrderTopProductsCard data={data} formatCurrency={formatCurrency} />
            <OrderTopCustomersCard data={data} formatCurrency={formatCurrency} />
          </div>

          {/* The same card the Sales Report uses, on the order clock. Its
              footnote is a checkable claim: the breakdown's total sits below
              `netValue` by exactly the delivery charges and order-level
              discounts, which are not split per item. */}
          <SalesBreakdownCard
            params={params}
            formatCurrency={formatCurrency}
            source="orders"
            title={t('breakdown.title')}
            description={t('breakdown.subtitle')}
            /* The default footnote compares against "Total Sales", which this
               page does not have — its headline is Net value. */
            basisNote={t('breakdown.basisNote')}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <OrderDistrictCard data={data} formatCurrency={formatCurrency} />
            <OrderSourceCard data={data} formatCurrency={formatCurrency} />
            <OrderRejectionCard data={data} />
          </div>
        </>
      ) : null}
    </div>
  )
}
