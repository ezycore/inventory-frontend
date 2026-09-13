'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

import { usePositionReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { cn } from '@/ui/lib/utils'

/**
 * Business position — a point-in-time worth snapshot, so **no period filter**.
 *
 * Presented as assets and liabilities side by side rather than as a statement, because it is a
 * balance at an instant, not a flow over time. Two things it must not do:
 *
 * - **Call itself a balance sheet.** There is no equity side and it does not balance in the
 *   accounting sense; the name invites someone to file it.
 * - **Hide `basis.stockTracked === false`** — a business that does not count stock has no stock
 *   asset, and printing ৳0 for it understates the asset total against a real liability side.
 * - **Hide `basis.cashTracked === false`** — with the `accounts` module off there are no wallets,
 *   so cash reads 0 because it is untracked, not because the drawer is empty.
 */

function Row({
  label,
  value,
  format,
  muted,
}: {
  label: string
  value: number
  format: (v: number) => string
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={cn('text-sm', muted && 'text-muted-foreground')}>{label}</span>
      <span className="tabular-nums">{format(value)}</span>
    </div>
  )
}

export function PositionReport() {
  const t = useTranslations('reports.position')
  const tEmpty = useTranslations('common.empty')
  const { data, isLoading } = usePositionReport()
  const { format } = useCurrency()

  const isPositive = (data?.netPosition ?? 0) >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-72" />
      ) : data ? (
        <>
          {!data.basis.cashTracked && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-amber-900 dark:text-amber-200">{t('cashNotTracked')}</p>
            </div>
          )}

          {!data.basis.stockTracked && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-amber-900 dark:text-amber-200">{t('stockNotTracked')}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('assets')}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label={t('cash')} value={data.assets.cash} format={format} />
                {/* COD a courier collected and has not remitted: an asset, but not cash —
                    kept out of `assets.cash` and counted in `assets.total`. Without the row
                    the asset lines stop summing to their own total. Dropped when zero, like
                    stock above, rather than printing ৳0 for a merchant who ships no COD. */}
                {data.assets.withCourier !== 0 && (
                  <Row
                    label={t('withCourier')}
                    value={data.assets.withCourier}
                    format={format}
                  />
                )}
                {/* Dropped, not zeroed. "Stock ৳0" as an asset line reads as a
                    shop that has sold out; the notice above says the truer
                    thing, which is that this business does not carry stock. */}
                {data.basis.stockTracked && (
                  <Row label={t('stockValue')} value={data.assets.stockValue} format={format} />
                )}
                <Row label={t('receivables')} value={data.assets.receivables} format={format} />
                <div className="flex items-center justify-between border-t-2 pt-3 font-semibold">
                  <span>{t('totalAssets')}</span>
                  <span className="tabular-nums">{format(data.assets.total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('liabilities')}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label={t('payables')} value={data.liabilities.payables} format={format} />
                <Row
                  label={t('customerCredit')}
                  value={data.liabilities.customerCredit}
                  format={format}
                />
                <div className="flex items-center justify-between border-t-2 pt-3 font-semibold">
                  <span>{t('totalLiabilities')}</span>
                  <span className="tabular-nums">{format(data.liabilities.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex items-center justify-between py-5">
              <span className="text-lg font-semibold">{t('netPosition')}</span>
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                )}
              >
                {format(data.netPosition)}
              </span>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">{t('basisNote')}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
      )}
    </div>
  )
}
