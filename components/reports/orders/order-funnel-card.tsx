'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Filter } from 'lucide-react'
import type { OrdersReportData } from '@/services/api/modules/reports/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'

/**
 * What became of a period's intake.
 *
 * Two shapes, and the card has to keep them apart or it lies. **The funnel bars
 * are "ever reached"** — an order that delivered passed through confirm and
 * process on the way, so it counts at every step and the bars overlap. **The
 * outcome chips are current status**, so those DO partition the cohort and add
 * back to `placed`. Drawing the funnel as a pie would show slices summing past
 * 100%; drawing the outcomes as a funnel would show them never shrinking.
 *
 * Mobile first: the stages are full-width rows with the bar under the label, so
 * nothing depends on a hover or a legend off the side of a phone screen.
 */
/**
 * The statuses this card has a translation for.
 *
 * A status the server adds later falls back to its raw key rather than
 * disappearing — the outcome chips must keep summing to the intake, and a
 * missing label is a cosmetic problem where a missing chip is an arithmetic one.
 */
const KNOWN_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'ready_for_pickup',
  'delivered',
  'picked_up',
  'returned',
  'partially_returned',
  'cancelled',
  'rejected',
]

export function OrderFunnelCard({ data }: { data: OrdersReportData }) {
  const t = useTranslations('reports.orders.funnel')
  const tStatus = useTranslations('reports.orders.status')
  const { funnel, outcomes } = data

  const stages = [
    { key: 'placed', value: funnel.placed },
    { key: 'confirmed', value: funnel.confirmed },
    { key: 'processing', value: funnel.processing },
    { key: 'dispatched', value: funnel.dispatched },
    { key: 'completed', value: funnel.completed },
  ] as const

  /** Percent of the intake, for the bar width. 0 orders means no bars at all. */
  const widthOf = (value: number) =>
    funnel.placed > 0 ? (value / funnel.placed) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t('title')}
        </CardTitle>
        {/* Says out loud that the bars overlap, because a reader will otherwise
            try to add them up and find they exceed the intake. */}
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnel.placed === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <>
            <div className="space-y-3">
              {stages.map((stage) => (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{t(`stages.${stage.key}`)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {stage.value}
                      {stage.key !== 'placed' && (
                        <span className="ml-2 text-xs">
                          {Math.round(widthOf(stage.value))}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${widthOf(stage.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                {t('outcomesTitle')}
              </p>
              <div className="flex flex-wrap gap-2">
                {outcomes.statuses.map((row) => (
                  <span
                    key={row.status}
                    className="rounded-full border px-2.5 py-1 text-xs"
                  >
                    {KNOWN_STATUSES.includes(row.status)
                      ? tStatus(row.status)
                      : row.status}
                    <span className="ml-1.5 font-medium tabular-nums">{row.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
