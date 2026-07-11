// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns'
import { AreaChart, DonutChart } from '@ui/components/charts'
import { Card } from '@ui/components/card'
import type { InventoryAnalytics } from '@/services/api/modules/inventory/analytics.types'
import { useMovementReasonLabel } from '@/hooks/use-movement-reason-label'

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
  const t = useTranslations('inventory.detail')
  const reasonLabel = useMovementReasonLabel()
  const { balanceTrend, movement, timezone } = analytics

  const balanceData = balanceTrend.map((b) => ({
    label: shortStamp(b.date, timezone),
    balance: b.balance,
  }))

  const reasonData = movement.reasonBreakdown.map((r) => ({
    name: reasonLabel(r.reason),
    value: r.quantity,
  }))

  const totalMovedUnits = reasonData.reduce((s, r) => s + r.value, 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {balanceData.length > 0 ? (
          <AreaChart
            title={t('chartBalanceTitle')}
            subtitle={t('chartBalanceSubtitle')}
            data={balanceData}
            series={[
              { dataKey: 'balance', name: t('chartBalanceSeries'), color: 'var(--color-primary)' },
            ]}
            height={280}
            showYAxis
            tooltipFormatter={(v) => t('unitsTooltip', { value: v.toLocaleString() })}
          />
        ) : (
          <EmptyChart title={t('chartBalanceTitle')} emptyText={t('chartEmpty')} />
        )}
      </div>

      {reasonData.length > 0 ? (
        <DonutChart
          title={t('chartReasonTitle')}
          subtitle={t('chartReasonSubtitle')}
          data={reasonData}
          centerValue={totalMovedUnits.toLocaleString()}
          centerLabel={t('unitsLabel')}
          height={220}
          showLegend
          legendPosition="bottom"
        />
      ) : (
        <EmptyChart title={t('chartReasonTitle')} emptyText={t('chartEmpty')} />
      )}
    </div>
  )
}

function EmptyChart({ title, emptyText }: { title: string; emptyText: string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-5 text-center">
      <h3 className="self-start text-sm font-semibold">{title}</h3>
      <p className="py-12 text-sm text-muted-foreground">{emptyText}</p>
    </Card>
  )
}
