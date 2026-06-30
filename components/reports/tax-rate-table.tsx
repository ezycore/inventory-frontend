'use client'
// coding-standard: maintained

import type { TaxRateRow } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'

function RateRows({
  rows,
  formatCurrency,
  emptyLabel,
}: {
  rows: TaxRateRow[]
  formatCurrency: (n: number) => string
  emptyLabel: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 border-b pb-1 text-xs text-muted-foreground">
        <span>Rate</span>
        <span className="text-right">Taxable base</span>
        <span className="text-right">Tax</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 text-sm">
          <span className="font-medium">
            {r.taxRate}%
            <span className="ml-1 text-xs text-muted-foreground">
              {r.taxType === 'inclusive' ? 'incl.' : 'excl.'}
            </span>
          </span>
          <span className="text-right tabular-nums">{formatCurrency(r.taxableBase)}</span>
          <span className="text-right font-medium tabular-nums">
            {formatCurrency(r.taxAmount)}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Per-rate tax breakdown for posted sales (output) and purchases (input), before returns. */
export function TaxRateTable({
  output,
  input,
  formatCurrency,
}: {
  output: TaxRateRow[]
  input: TaxRateRow[]
  formatCurrency: (n: number) => string
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output Tax by Rate (Sales)</CardTitle>
        </CardHeader>
        <CardContent>
          <RateRows rows={output} formatCurrency={formatCurrency} emptyLabel="No taxed sales" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Input Tax by Rate (Purchases)</CardTitle>
        </CardHeader>
        <CardContent>
          <RateRows
            rows={input}
            formatCurrency={formatCurrency}
            emptyLabel="No taxed purchases"
          />
        </CardContent>
      </Card>
    </div>
  )
}
