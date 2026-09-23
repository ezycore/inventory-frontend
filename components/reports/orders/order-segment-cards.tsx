'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { MapPin, Radio, ThumbsDown, Truck } from 'lucide-react'
import type { OrdersReportData } from '@/services/api/modules/reports/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'

/**
 * Where the losses concentrate — courier, district, order source, and why orders
 * were turned away.
 *
 * **A rate is `null`, not 0, when nothing reached a door.** These render "—".
 * A courier whose parcels are all still in flight has no RTO rate; printing 0%
 * would read as a flawless week and is the single easiest way to make this page
 * lie.
 *
 * Mobile first: every one of these is a row list, not a table. The courier row
 * would be nine columns on a desktop table and a horizontal scrollbar on a
 * phone, so the phone layout stacks its figures under the name and the wider
 * screen simply gets more room, never a different component.
 */

/** Order sources this card can name. Anything else prints its own raw value. */
const KNOWN_CHANNELS = [
  'website',
  'messenger',
  'whatsapp',
  'instagram',
  'comment',
  'phone',
  'manual',
]

/** The structured rejection reasons — the enum exists so they can be counted. */
const KNOWN_REASONS = [
  'fake_number',
  'no_answer',
  'out_of_stock',
  'price_dispute',
  'duplicate',
  'other',
]

/** A rate as a percent, or an em dash when there is nothing to divide by. */
function RateText({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-muted-foreground">—</span>
  const pct = rate * 100
  return (
    <span className={pct >= 15 ? 'font-medium text-red-600' : 'font-medium'}>
      {pct.toFixed(1)}%
    </span>
  )
}

export function OrderCourierCard({
  data,
  formatCurrency,
}: {
  data: OrdersReportData
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.orders.couriers')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.byCourier.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          data.byCourier.map((row) => (
            <div
              key={row.provider ?? 'none'}
              className="space-y-1 border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {/* The null bucket is NOT just orders awaiting dispatch: a
                      pickup order is collected by the customer and never has a
                      courier at all. A browser pass caught this row reading
                      "Not dispatched yet" beside "Delivered 2". */}
                  {row.name ?? row.provider ?? t('noCourier')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('orders', { count: row.orders })}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {t('delivered')} <span className="font-medium">{row.delivered}</span>
                </span>
                <span>
                  {t('returned')} <span className="font-medium">{row.returned}</span>
                </span>
                <span>
                  {t('rto')} <RateText rate={row.rtoRate} />
                </span>
                <span>
                  {t('deliveryMargin')}{' '}
                  <span
                    className={
                      row.margin < 0 ? 'font-medium text-red-600' : 'font-medium'
                    }
                  >
                    {formatCurrency(row.margin)}
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function OrderDistrictCard({
  data,
  formatCurrency,
}: {
  data: OrdersReportData
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.orders.districts')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('title')}
        </CardTitle>
        {/* Ranked by volume, not by rate — one refused parcel out of one is a
            100% rate and not a finding, and it would top the list every time. */}
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.byDistrict.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          data.byDistrict.map((row) => (
            <div
              key={row.district ?? 'none'}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="font-medium">{row.district ?? t('noDistrict')}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t('orders', { count: row.orders })}</span>
                <span className="tabular-nums">{formatCurrency(row.netValue)}</span>
                <RateText rate={row.rtoRate} />
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function OrderSourceCard({
  data,
  formatCurrency,
}: {
  data: OrdersReportData
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.orders.sources')
  const tChannel = useTranslations('reports.orders.channel')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-4 w-4" />
          {/* "Order source", never "Channel": the dashboard's channel mix is the
              counter/online revenue split, a different question with the same word. */}
          {t('title')}
        </CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.bySource.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          data.bySource.map((row) => (
            <div key={row.channel ?? 'none'} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">
                  {row.channel && KNOWN_CHANNELS.includes(row.channel)
                    ? tChannel(row.channel)
                    : (row.channel ?? t('unknown'))}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(row.netValue)} · {row.share}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, row.share)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function OrderRejectionCard({ data }: { data: OrdersReportData }) {
  const t = useTranslations('reports.orders.rejections')
  const tReason = useTranslations('reports.orders.rejectionReason')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ThumbsDown className="h-4 w-4" />
          {t('title')}
        </CardTitle>
        {/* Rejections only — cancelling is usually the shopper changing their
            mind, rejecting is the merchant turning the order away. */}
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.rejections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          data.rejections.map((row) => (
            <div
              key={row.reason ?? 'none'}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="font-medium">
                {row.reason && KNOWN_REASONS.includes(row.reason)
                  ? tReason(row.reason)
                  : t('unrecorded')}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {row.count} · {row.share}%
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
