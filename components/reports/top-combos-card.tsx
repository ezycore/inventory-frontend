'use client'
// coding-standard: maintained

import { Package } from 'lucide-react'
import { useComboSalesReport } from '@/services/api'
import type {
  ComboSalesRow,
  ReportParams,
} from '@/services/api/modules/reports/api'
import { useAuthStore } from '@/services/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'

/**
 * Combo-level sales rollup (units / orders / revenue per combo). Sale lines are
 * stored as exploded components, so this reads the dedicated combo report. Hidden
 * when the combo feature is off or nothing sold in the period.
 */
export function TopCombosCard({
  params,
  formatCurrency,
}: {
  params?: ReportParams
  formatCurrency: (n: number) => string
}) {
  const comboEnabled = !!useAuthStore(
    (s) => s.user?.organization?.features?.combo,
  )
  const { data } = useComboSalesReport(params, comboEnabled)

  if (!comboEnabled) return null
  const combos = data?.combos ?? []
  if (combos.length === 0) return null

  const columns: SimpleColumn<ComboSalesRow>[] = [
    { key: 'name', header: 'Combo', cell: (r) => r.comboName ?? '—' },
    {
      key: 'units',
      header: 'Units sold',
      align: 'right',
      cell: (r) => Math.round(r.unitsSold),
    },
    { key: 'orders', header: 'Sales', align: 'right', cell: (r) => r.orders },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      cell: (r) => formatCurrency(r.revenue),
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-orange-600" />
          Top Combos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable columns={columns} rows={combos} getRowKey={(r) => r.comboId} />
      </CardContent>
    </Card>
  )
}
