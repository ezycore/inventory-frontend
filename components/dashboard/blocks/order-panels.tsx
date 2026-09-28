'use client'
// coding-standard: maintained

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { Progress } from '@ui/components/progress'
import { useEcommerceDashboard } from '@/services/api'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { storefrontUrl } from '@/lib/storefront-url'
import { CheckCircle2, ExternalLink, PackageX, Store } from 'lucide-react'
import type { DashboardBlockContext } from './context'

/**
 * What happened to orders in the period, and which carrier took them.
 *
 * EVENT clock (2026-09-28): "Delivered 4" on Today means four orders reached a
 * door today, whenever they were placed. It used to count the orders PLACED in
 * the period by their current status, so Today almost always read "Delivered 0"
 * — an order taken this morning has not arrived yet.
 */
export function OrderFulfillment({ overview, isLoading }: DashboardBlockContext) {
  const t = useTranslations('dashboard.fulfillment')

  if (isLoading || !overview?.ordersFulfillment) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-4 h-4 w-36" />
        <Skeleton className="h-32 w-full" />
      </Card>
    )
  }

  const { confirmed, shipped, delivered, returned, cancelled, byCourier } =
    overview.ordersFulfillment
  const settled = delivered + returned
  const moved = confirmed + shipped + settled + cancelled
  // Of the parcels that reached a door. An order still in the queue has not had
  // its chance to be refused, so counting it as a success reports a rate that
  // only improves while a shop is busy.
  const arrivedRate = settled > 0 ? Math.round((delivered / settled) * 100) : null

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <Link
          href="/ecommerce/orders"
          className="text-xs font-semibold text-primary"
        >
          {t('viewAll')}
        </Link>
      </div>

      {moved === 0 ? (
        <p className="text-sm text-muted-foreground">{t('nothingMoved')}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Outcome label={t('confirmed')} value={confirmed} tone="text-primary" />
            <Outcome label={t('shipped')} value={shipped} tone="text-chart-1" />
            <Outcome label={t('delivered')} value={delivered} tone="text-chart-2" />
            <Outcome label={t('returned')} value={returned} tone="text-destructive" />
            <Outcome
              label={t('cancelled')}
              value={cancelled}
              tone="text-muted-foreground"
            />
          </div>

          {arrivedRate !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{t('arrivalRate')}</p>
                <span className="text-xs font-semibold tabular-nums">
                  {arrivedRate}%
                </span>
              </div>
              <Progress value={arrivedRate} className="h-1.5" />
            </div>
          )}

          {byCourier.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('byCourier')}
              </p>
              <ul className="space-y-1">
                {byCourier.map((row) => (
                  <li
                    key={row.provider}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">{row.provider}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function Outcome({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

/**
 * Is the shop actually open, and can a customer reach it?
 *
 * Reads `GET /ecommerce/dashboard`, the same shared query the recent-orders
 * block beside it already loads — so this costs no extra request, and it does
 * not re-derive a page P5 is about to merge.
 */
export function StoreHealth() {
  const t = useTranslations('dashboard.storeHealth')
  const { data, isLoading } = useEcommerceDashboard()
  const slug = useAuthStore((s) => s.user?.organization?.slug)

  if (isLoading || !data) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </Card>
    )
  }

  const address = data.customDomain
    ? `https://${data.customDomain}`
    : slug
      ? storefrontUrl(slug)
      : null

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold">{t('title')}</h2>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {data.published ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-chart-2" />
              <span>{t('open')}</span>
            </>
          ) : (
            <>
              <PackageX className="h-4 w-4 text-destructive" />
              <Link href="/ecommerce/settings" className="font-medium text-primary">
                {t('closed')}
              </Link>
            </>
          )}
        </div>

        {address && (
          <a
            href={address}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-primary"
          >
            <Store className="h-4 w-4" />
            <span className="truncate">{address.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-3 w-3 flex-none" />
          </a>
        )}

        <dl className="grid grid-cols-2 gap-3 pt-1">
          <Metric
            label={t('liveProducts')}
            value={data.stats.liveProducts}
            href="/products?tab=online"
          />
          <Metric
            label={t('abandonedCarts')}
            value={data.stats.abandonedCarts}
            href="/ecommerce/carts"
          />
        </dl>
      </div>
    </Card>
  )
}

function Metric({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href: string
}) {
  return (
    <Link href={href} className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </Link>
  )
}
