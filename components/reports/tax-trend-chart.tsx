'use client'
// coding-standard: maintained

import type { TaxChartPoint } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'

/** Gross tax collected (output) vs paid (input) per time bucket, as paired bars. */
export function TaxTrendChart({
  data,
  formatCurrency,
}: {
  data: TaxChartPoint[]
  formatCurrency: (n: number) => string
}) {
  if (data.length === 0) return null
  const max = Math.max(1, ...data.map((d) => Math.max(d.output, d.input)))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-primary/80" /> Output (collected)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-orange-400" /> Input (paid)
          </span>
        </div>
        <div className="space-y-2">
          {data.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{p.label}</span>
              <div className="flex-1 space-y-1">
                <div className="h-3 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm bg-primary/80"
                    style={{ width: `${(p.output / max) * 100}%` }}
                  />
                </div>
                <div className="h-3 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm bg-orange-400"
                    style={{ width: `${(p.input / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-40 text-right text-xs tabular-nums">
                <span className="text-primary">{formatCurrency(p.output)}</span>
                {' / '}
                <span className="text-orange-500">{formatCurrency(p.input)}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
