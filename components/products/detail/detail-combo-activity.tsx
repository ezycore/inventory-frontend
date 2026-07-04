// coding-standard: maintained
'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { AreaChart } from '@ui/components/charts'
import { Receipt, RotateCcw } from 'lucide-react'
import { useComboSalesActivity } from '@/services/api'
import type { ComboRecentSale } from '@/services/api/modules/reports/api'

// Wide custom range → lifetime activity (the report has no "all-time" period).
const LIFETIME = { period: 'custom' as const, startDate: '2000-01-01', endDate: '2999-12-31' }

interface DetailComboActivityProps {
  comboProductId: string
  formatCurrency: (n: number) => string
}

/** Short axis label for a `yyyy-MM-dd` bucket (parsed as a local date). */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (y && m && d) return format(new Date(y, m - 1, d), 'MMM d')
  return iso
}

/**
 * Sales activity for one combo (combo detail page): a daily revenue trend, the
 * recent sale transactions, and returns totals. Data comes from the combo sales
 * activity report (`/reports/combos/:id/activity`). Gated on the sell page by
 * the caller (only rendered when the sales module is on).
 */
export function DetailComboActivity({ comboProductId, formatCurrency }: DetailComboActivityProps) {
  const { data } = useComboSalesActivity(comboProductId, LIFETIME)

  const trendData = (data?.trend ?? []).map((t) => ({
    label: shortDate(t.date),
    revenue: t.revenue,
  }))
  const recentSales = data?.recentSales ?? []
  const returns = data?.returns

  const columns: SimpleColumn<ComboRecentSale>[] = [
    { key: 'date', header: 'Date', cell: (r) => format(new Date(r.date), 'MMM d, yyyy') },
    {
      key: 'invoice',
      header: 'Invoice',
      cell: (r) => <span className="font-mono text-xs">{r.invoiceNumber ?? '—'}</span>,
    },
    { key: 'combos', header: 'Combos', align: 'right', cell: (r) => r.combos.toLocaleString() },
    { key: 'amount', header: 'Amount', align: 'right', cell: (r) => formatCurrency(r.amount) },
  ]

  const hasReturns = !!returns && (returns.combosReturned > 0 || returns.refundTotal > 0)

  // Nothing sold yet → skip the whole activity block.
  if (recentSales.length === 0 && trendData.length === 0 && !hasReturns) return null

  return (
    <div className="space-y-6">
      {trendData.length > 1 && (
        <AreaChart
          title="Revenue trend"
          subtitle="Combo revenue over time"
          data={trendData}
          series={[{ dataKey: 'revenue', name: 'Revenue', color: 'var(--color-primary)' }]}
          height={240}
          showYAxis
          tooltipFormatter={formatCurrency}
        />
      )}

      {recentSales.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Recent sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable columns={columns} rows={recentSales} getRowKey={(r) => r.saleId} />
          </CardContent>
        </Card>
      )}

      {hasReturns && returns && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="h-4 w-4 text-amber-600" />
              Returns
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8">
            <div>
              <p className="text-2xl font-bold">{returns.combosReturned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">combos returned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(returns.refundTotal)}</p>
              <p className="text-xs text-muted-foreground">refund total</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
