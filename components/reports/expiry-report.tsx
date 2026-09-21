'use client'
// coding-standard: maintained

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Translator } from '@/i18n/config'
import { useExpiringBatches, useExpiredBatches } from '@/services/api'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import { AlertTriangle, CalendarClock, PackageX, Boxes } from 'lucide-react'
import { useOrgCalendar } from '@/hooks/use-org-calendar'
import { daysUntilDateOnly, storedDateKey } from '@/lib/org-calendar'
import { ExpiryWriteOffDialog } from './expiry-write-off-dialog'
import { lotValue, type ExpiryBatchRow } from './expiry-report-types'

/**
 * `null` = let each product's own `expiryAlertDays` decide, which is what the
 * product form promises the setting does. It leads the list because it is the
 * honest default: a fixed window is the merchant overriding their own
 * per-product judgement, not the starting point (QA-071).
 */
const DAY_OPTIONS: (number | null)[] = [null, 7, 15, 30, 60, 90]


function BatchTable({
  rows,
  emptyText,
  tone,
  currency,
  onWriteOff,
  t,
}: {
  rows: ExpiryBatchRow[]
  emptyText: string
  tone: 'expired' | 'expiring'
  currency?: string
  /** Present on the expired table only — an in-date lot has nothing to write off. */
  onWriteOff?: (row: ExpiryBatchRow) => void
  /** Bound to the `reports.expiry` namespace. */
  t: Translator
}) {
  // Days on the org's calendar: an expiry date is a day, and a lot expiring
  // today has 0 days left (it is still good) wherever the viewer's device is.
  const { timezone } = useOrgCalendar()

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium">{t('colProduct')}</th>
            <th className="pb-2 font-medium">{t('colBatch')}</th>
            <th className="pb-2 font-medium">{t('colLocation')}</th>
            <th className="pb-2 font-medium">{t('colExpiry')}</th>
            <th className="pb-2 font-medium text-right">
              {tone === 'expired' ? t('colDaysOverdue') : t('colDaysLeft')}
            </th>
            <th className="pb-2 font-medium text-right">{t('colQty')}</th>
            <th className="pb-2 font-medium text-right">{t('colValue')}</th>
            {onWriteOff && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const left = daysUntilDateOnly(b.expiryDate, timezone)
            return (
              <tr key={b._id} className="border-b last:border-0">
                <td className="py-2">{b.productId?.name || t('unknownProduct')}</td>
                <td className="py-2">{b.batchNumber || '-'}</td>
                <td className="py-2">{b.locationId?.name || '-'}</td>
                <td className="py-2">{storedDateKey(b.expiryDate)}</td>
                <td className="py-2 text-right">
                  <Badge
                    variant={tone === 'expired' ? 'destructive' : 'secondary'}
                  >
                    {tone === 'expired' ? Math.abs(left) : left}
                  </Badge>
                </td>
                <td className="py-2 text-right font-medium">
                  {b.remainingQuantity.toLocaleString()}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(lotValue([b]), currency)}
                </td>
                {onWriteOff && (
                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWriteOff(b)}
                    >
                      {t('writeOff.action')}
                    </Button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** A KPI card: the count, what it means, and — where it is a loss — what it costs. */
function ExpiryKpi({
  title,
  icon,
  value,
  caption,
  money,
  tone,
}: {
  title: string
  icon: React.ReactNode
  value: string
  caption: string
  /** Rendered under the caption. Omitted on the cards that count batches. */
  money?: string
  tone?: 'destructive'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{caption}</p>
        {money && (
          <p
            className={`mt-1 text-sm font-semibold tabular-nums ${tone === 'destructive' ? 'text-destructive' : ''}`}
          >
            {money}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ExpiryReport() {
  const t = useTranslations('reports.expiry')
  // null = per-product windows; the backend applies each product's own setting
  // when `days` is absent.
  const [days, setDays] = useState<number | null>(null)
  const [writeOffLot, setWriteOffLot] = useState<ExpiryBatchRow | null>(null)
  const currency = useAuthStore((s) => s.user?.organization?.currency)
  // Reading this report needs `stock.view`; writing a lot off is an
  // `inventory/bulk-adjust`, which needs `stock.manage`. Those are different
  // permissions and a `viewer` holds only the first — so the button was offered
  // to someone the API would then 403, on the one screen whose headline card
  // reads "Quantity to write off".
  const canWriteOff = useAuthStore((s) =>
    (s.user?.permissions ?? []).includes('stock.manage'),
  )

  const { data: expiringResp, isLoading: loadingExpiring } = useExpiringBatches({
    ...(days ? { days } : {}),
    limit: 200,
  })
  const { data: expiredResp, isLoading: loadingExpired } = useExpiredBatches({
    limit: 200,
  })

  const expiring: ExpiryBatchRow[] = (expiringResp?.data as any)?.items || []
  const expired: ExpiryBatchRow[] = (expiredResp?.data as any)?.items || []

  const expiringUnits = expiring.reduce((s, b) => s + (b.remainingQuantity || 0), 0)
  const expiredUnits = expired.reduce((s, b) => s + (b.remainingQuantity || 0), 0)
  // Money is the number the decision turns on: "400 units" tells a pharmacist
  // nothing about whether to act today or next week (QA-069). Cost, not retail —
  // this is what the shop is out of pocket, not revenue it never earned.
  const expiredValue = lotValue(expired)
  const expiringValue = lotValue(expiring)

  const windowLabel = days
    ? t('withinDays', { count: days })
    : t('perProductWindow')

  const isLoading = loadingExpiring || loadingExpired

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="expiry-window" className="text-sm text-muted-foreground">
            {t('expiringWithin')}
          </label>
          <select
            id="expiry-window"
            value={days ?? ''}
            onChange={(e) => setDays(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d ?? 'per-product'} value={d ?? ''}>
                {d === null ? t('perProductWindow') : t('daysSuffix', { count: d })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExpiryKpi
              title={t('expiredBatches')}
              icon={<PackageX className="h-4 w-4 text-destructive" />}
              value={String(expired.length)}
              caption={t('pastExpiryStillInStock')}
            />
            <ExpiryKpi
              title={t('expiredUnits')}
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              value={expiredUnits.toLocaleString()}
              caption={t('qtyToWriteOff')}
              money={t('valueAtCost', {
                amount: formatCurrency(expiredValue, currency),
              })}
              tone="destructive"
            />
            <ExpiryKpi
              title={t('expiringSoon')}
              icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
              value={String(expiring.length)}
              caption={windowLabel}
            />
            <ExpiryKpi
              title={t('expiringUnits')}
              icon={<Boxes className="h-4 w-4 text-muted-foreground" />}
              value={expiringUnits.toLocaleString()}
              caption={t('qtyAtRisk')}
              money={t('valueAtCost', {
                amount: formatCurrency(expiringValue, currency),
              })}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('expiredSection')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchTable
                rows={expired}
                tone="expired"
                emptyText={t('noExpiredStock')}
                currency={currency}
                onWriteOff={canWriteOff ? setWriteOffLot : undefined}
                t={t}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {days
                  ? t('expiringSection', { count: days })
                  : t('expiringSectionPerProduct')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BatchTable
                rows={expiring}
                tone="expiring"
                emptyText={t('nothingExpiring')}
                currency={currency}
                t={t}
              />
            </CardContent>
          </Card>

          <ExpiryWriteOffDialog
            lot={writeOffLot}
            onOpenChange={(open) => !open && setWriteOffLot(null)}
          />
        </>
      )}
    </div>
  )
}
