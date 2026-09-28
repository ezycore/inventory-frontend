'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'

import { useProfitLossReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { isFeatureOn } from '@/lib/feature-utils'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { cn } from '@/ui/lib/utils'
import { useReportPeriod } from './use-report-period'
import { PeriodFilter } from '@/components/shared/period-filter'

/**
 * Profit & Loss — statement-style, deliberately not chart-first.
 *
 * The number people act on is a single figure at the bottom, so the layout is a ledger-style
 * table rather than a tile wall. Two things it must never hide:
 *
 * - **`basis.expensesTracked === false`** (org has no `accounts` module) — net profit then equals
 *   gross profit, which reads as "no expenses" unless we say "not tracked". Hence the banner.
 * - **The basis footnote** — revenue is accrual, expenses are cash. This is not an audited
 *   income statement and must not be presented as one.
 */

/** One line of the statement. `emphasis` marks a subtotal; `negate` renders a deduction. */
interface StatementRow {
  label: string
  value: number
  emphasis?: boolean
  negate?: boolean
  muted?: boolean
}

function StatementLine({
  row,
  format,
}: {
  row: StatementRow
  format: (v: number) => string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        row.emphasis && 'border-t font-semibold',
        row.muted && 'text-sm text-muted-foreground',
      )}
    >
      <span className={cn(row.muted && 'pl-4')}>{row.label}</span>
      <span className="tabular-nums">
        {row.negate ? `(${format(row.value)})` : format(row.value)}
      </span>
    </div>
  )
}

function calcChange(current: number, previous: number) {
  if (previous === 0) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

export function ProfitLossReport() {
  const t = useTranslations('reports.profitLoss')
  // "Sale" is POS vocabulary (orders-first-storefront): without POS, revenue is
  // dispatched orders and the returns are order returns.
  const posOn = isFeatureOn(
    useAuthStore((state) => state.user?.organization?.features),
    'sales',
  )
  const tCategories = useTranslations('accounts.transactions.categories')
  const tEmpty = useTranslations('common.empty')
  const {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    params,
  } = useReportPeriod()
  const { data, isLoading } = useProfitLossReport(params)
  const { format } = useCurrency()

  const netChange = data
    ? calcChange(data.summary.netProfit, data.previous.netProfit)
    : null
  const isProfit = (data?.summary.netProfit ?? 0) >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
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
        <Skeleton className="h-96" />
      ) : data ? (
        <>
          {!data.basis.expensesTracked && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-amber-900 dark:text-amber-200">
                {t('expensesNotTracked')}
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t('statement')}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y-0">
                <StatementLine
                  row={{ label: t('revenueGross'), value: data.summary.revenue.gross }}
                  format={format}
                />
                {data.summary.revenue.returns > 0 && (
                  <StatementLine
                    row={{
                      label: t(posOn ? 'returns' : 'returnsNoPos'),
                      value: data.summary.revenue.returns,
                      negate: true,
                      muted: true,
                    }}
                    format={format}
                  />
                )}
                <StatementLine
                  row={{ label: t('revenueNet'), value: data.summary.revenue.net, emphasis: true }}
                  format={format}
                />
                <StatementLine
                  row={{ label: t('cogs'), value: data.summary.cogs.net, negate: true }}
                  format={format}
                />
                <StatementLine
                  row={{ label: t('grossProfit'), value: data.summary.grossProfit, emphasis: true }}
                  format={format}
                />
                {data.summary.otherIncome > 0 && (
                  <StatementLine
                    row={{ label: t('otherIncome'), value: data.summary.otherIncome }}
                    format={format}
                  />
                )}
                <StatementLine
                  row={{
                    label: t('operatingExpenses'),
                    value: data.summary.operatingExpenses,
                    negate: true,
                  }}
                  format={format}
                />
                {data.summary.expenseBreakdown.map((e) => (
                  <StatementLine
                    key={e.category}
                    row={{ label: tCategories(e.category), value: e.total, negate: true, muted: true }}
                    format={format}
                  />
                ))}
                <div className="mt-2 flex items-center justify-between border-t-2 pt-3 text-lg font-bold">
                  <span>{t('netProfit')}</span>
                  <span
                    className={cn(
                      'tabular-nums',
                      isProfit
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-destructive',
                    )}
                  >
                    {format(data.summary.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('vsPrevious')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {netChange !== null && (
                  <div className="flex items-center gap-2">
                    {netChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{netChange}%</span>
                    <span className="text-muted-foreground">{t('netProfitChange')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('revenueNet')}</span>
                  <span className="tabular-nums">{format(data.previous.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('grossProfit')}</span>
                  <span className="tabular-nums">{format(data.previous.grossProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('operatingExpenses')}</span>
                  <span className="tabular-nums">{format(data.previous.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t('netProfit')}</span>
                  <span className="tabular-nums">{format(data.previous.netProfit)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            {t(posOn ? 'basisNote' : 'basisNoteOrders')}
            {data.basis.vatExcluded ? ` ${t('vatExcludedNote')}` : ''}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
      )}
    </div>
  )
}
