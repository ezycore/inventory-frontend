// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { formatInTimeZone } from 'date-fns-tz'
import { AreaChart, BarChart, DonutChart } from '@ui/components/charts'
import { Card } from '@ui/components/card'
import type { ProductAnalytics } from '@/services/api/modules/inventory/analytics.types'
import { useMovementReasonLabel } from '@/hooks/use-movement-reason-label'

interface DetailChartsProps {
  analytics: ProductAnalytics
  /** Sales module gate — hide the transactional sales mini-stats when off. */
  salesEnabled: boolean
  formatCurrency: (n: number) => string
}

/**
 * Short axis label for a `yyyy-MM-dd` trend point. The server already buckets
 * dates in the org timezone, so the key already names the day: print it as a UTC
 * calendar date, which no zone can shift.
 */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (y && m && d) return formatInTimeZone(new Date(Date.UTC(y, m - 1, d)), 'UTC', 'MMM d')
  return iso
}

export function DetailCharts({ analytics, salesEnabled, formatCurrency }: DetailChartsProps) {
  const t = useTranslations('products.products.detail.charts')
  const reasonLabel = useMovementReasonLabel()
  const { trend, movement, stock } = analytics

  const trendData = trend.map((pt) => ({
    label: shortDate(pt.date),
    in: pt.in,
    out: pt.out,
  }))

  const reasonData = movement.reasonBreakdown.map((r) => ({
    name: reasonLabel(r.reason),
    value: r.quantity,
  }))

  const locationData = stock.byLocation
    .filter((l) => l.quantity > 0 || l.quantityAlert > 0)
    .map((l) => ({ label: l.locationName, quantity: l.quantity }))

  const totalMovedUnits = reasonData.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-6">
      <AreaChart
        title={t('movementTitle')}
        subtitle={t('movementSubtitle')}
        data={trendData}
        series={[
          { dataKey: 'in', name: t('stockIn'), color: 'var(--color-chart-2)' },
          { dataKey: 'out', name: t('stockOut'), color: 'var(--color-chart-1)' },
        ]}
        height={260}
        showYAxis
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {reasonData.length > 0 ? (
          <DonutChart
            title={t('reasonTitle')}
            subtitle={t('reasonSubtitle')}
            data={reasonData}
            centerValue={totalMovedUnits.toLocaleString()}
            centerLabel={t('units')}
            legendPosition="bottom"
          />
        ) : (
          <EmptyChart title={t('reasonTitle')} noData={t('noData')} />
        )}

        {locationData.length > 0 ? (
          <BarChart
            title={t('locationTitle')}
            subtitle={t('locationSubtitle')}
            data={locationData}
            series={[{ dataKey: 'quantity', name: t('onHand') }]}
            height={250}
            showYAxis
            tooltipFormatter={(v) => t('unitsSuffix', { value: v.toLocaleString() })}
          />
        ) : (
          <EmptyChart title={t('locationTitle')} noData={t('noData')} />
        )}
      </div>

      {salesEnabled && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat label={t('unitsSold')} value={analytics.sales.unitsSold.toLocaleString()} />
          <MiniStat label={t('revenue')} value={formatCurrency(analytics.sales.revenue)} />
          <MiniStat label={t('grossProfit')} value={formatCurrency(analytics.sales.grossProfit)} />
          <MiniStat label={t('orders')} value={analytics.sales.orderCount.toLocaleString()} />
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      {/* Same half-width mobile tile as DetailStats — a long amount must wrap, not spill. */}
      <p className="mt-1 break-words text-lg font-bold tabular-nums sm:text-xl">{value}</p>
    </Card>
  )
}

function EmptyChart({ title, noData }: { title: string; noData: string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-5 text-center">
      <h3 className="self-start text-sm font-semibold">{title}</h3>
      <p className="py-12 text-sm text-muted-foreground">{noData}</p>
    </Card>
  )
}
