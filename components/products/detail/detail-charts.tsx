// coding-standard: maintained
'use client'

import { format } from 'date-fns'
import { AreaChart, BarChart, DonutChart } from '@ui/components/charts'
import { Card } from '@ui/components/card'
import type { ProductAnalytics } from '@/services/api/modules/inventory/analytics.types'
import { MOVEMENT_REASON_LABEL } from './utils'

interface DetailChartsProps {
  analytics: ProductAnalytics
  /** Sales module gate — hide the transactional sales mini-stats when off. */
  salesEnabled: boolean
  formatCurrency: (n: number) => string
}

/** Short axis label for an ISO `yyyy-MM-dd` trend point. */
function shortDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d')
  } catch {
    return iso
  }
}

export function DetailCharts({ analytics, salesEnabled, formatCurrency }: DetailChartsProps) {
  const { trend, movement, stock } = analytics

  const trendData = trend.map((t) => ({
    label: shortDate(t.date),
    in: t.in,
    out: t.out,
  }))

  const reasonData = movement.reasonBreakdown.map((r) => ({
    name: MOVEMENT_REASON_LABEL[r.reason] || r.reason,
    value: r.quantity,
  }))

  const locationData = stock.byLocation
    .filter((l) => l.quantity > 0 || l.quantityAlert > 0)
    .map((l) => ({ label: l.locationName, quantity: l.quantity }))

  const totalMovedUnits = reasonData.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-6">
      <AreaChart
        title="Stock Movement"
        subtitle="Units in vs out — last 30 days"
        data={trendData}
        series={[
          { dataKey: 'in', name: 'Stock In', color: 'var(--color-chart-2)' },
          { dataKey: 'out', name: 'Stock Out', color: 'var(--color-chart-1)' },
        ]}
        height={260}
        showYAxis
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {reasonData.length > 0 ? (
          <DonutChart
            title="Movement by Reason"
            subtitle="Share of units moved"
            data={reasonData}
            centerValue={totalMovedUnits.toLocaleString()}
            centerLabel="units"
          />
        ) : (
          <EmptyChart title="Movement by Reason" />
        )}

        {locationData.length > 0 ? (
          <BarChart
            title="Stock by Location"
            subtitle="On-hand units per location"
            data={locationData}
            series={[{ dataKey: 'quantity', name: 'On hand' }]}
            height={250}
            showYAxis
            tooltipFormatter={(v) => `${v.toLocaleString()} units`}
          />
        ) : (
          <EmptyChart title="Stock by Location" />
        )}
      </div>

      {salesEnabled && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat label="Units Sold" value={analytics.sales.unitsSold.toLocaleString()} />
          <MiniStat label="Revenue" value={formatCurrency(analytics.sales.revenue)} />
          <MiniStat label="Gross Profit" value={formatCurrency(analytics.sales.grossProfit)} />
          <MiniStat label="Orders" value={analytics.sales.orderCount.toLocaleString()} />
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </Card>
  )
}

function EmptyChart({ title }: { title: string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-5 text-center">
      <h3 className="self-start text-sm font-semibold">{title}</h3>
      <p className="py-12 text-sm text-muted-foreground">No data yet</p>
    </Card>
  )
}
