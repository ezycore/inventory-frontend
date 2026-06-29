// coding-standard: maintained
'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns'
import { AreaChart, DonutChart } from '@ui/components/charts'
import { Card } from '@ui/components/card'
import type { InventoryAnalytics } from '@/services/api/modules/inventory/analytics.types'
import { MOVEMENT_REASON_LABEL } from '@/components/products/detail/utils'

interface InventoryChartsProps {
  analytics: InventoryAnalytics
}

/** Short axis label for an ISO timestamp balance point, in the org timezone. */
function shortStamp(iso: string, timezone?: string): string {
  try {
    return timezone
      ? formatInTimeZone(new Date(iso), timezone, 'MMM d')
      : format(new Date(iso), 'MMM d')
  } catch {
    return iso
  }
}

export function InventoryCharts({ analytics }: InventoryChartsProps) {
  const { balanceTrend, movement, timezone } = analytics

  const balanceData = balanceTrend.map((b) => ({
    label: shortStamp(b.date, timezone),
    balance: b.balance,
  }))

  const reasonData = movement.reasonBreakdown.map((r) => ({
    name: MOVEMENT_REASON_LABEL[r.reason] || r.reason,
    value: r.quantity,
  }))

  const totalMovedUnits = reasonData.reduce((s, r) => s + r.value, 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {balanceData.length > 0 ? (
          <AreaChart
            title="Stock Level Over Time"
            subtitle="Running balance after each movement"
            data={balanceData}
            series={[
              { dataKey: 'balance', name: 'On hand', color: 'var(--color-primary)' },
            ]}
            height={280}
            showYAxis
            tooltipFormatter={(v) => `${v.toLocaleString()} units`}
          />
        ) : (
          <EmptyChart title="Stock Level Over Time" />
        )}
      </div>

      {reasonData.length > 0 ? (
        <DonutChart
          title="Movement by Reason"
          subtitle="Units moved at this location"
          data={reasonData}
          centerValue={totalMovedUnits.toLocaleString()}
          centerLabel="units"
          height={220}
          showLegend
          legendPosition="bottom"
        />
      ) : (
        <EmptyChart title="Movement by Reason" />
      )}
    </div>
  )
}

function EmptyChart({ title }: { title: string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-5 text-center">
      <h3 className="self-start text-sm font-semibold">{title}</h3>
      <p className="py-12 text-sm text-muted-foreground">No movement data yet</p>
    </Card>
  )
}
