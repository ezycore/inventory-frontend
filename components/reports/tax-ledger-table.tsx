'use client'
// coding-standard: maintained

import { useState } from 'react'
import { format } from 'date-fns'
import type { ReportParams, TaxLedgerKind } from '@/services/api'
import { useTaxLedger } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Skeleton } from '@ui/components/skeleton'

const KIND_LABEL: Record<TaxLedgerKind, string> = {
  sale: 'Sale',
  sales_return: 'Sales Return',
  purchase: 'Purchase',
  purchase_return: 'Purchase Return',
}

/** Paginated, chronological list of every tax event for the period. */
export function TaxLedgerTable({
  params,
  enabled,
  formatCurrency,
}: {
  params?: ReportParams
  enabled: boolean
  formatCurrency: (n: number) => string
}) {
  const [page, setPage] = useState(1)
  // Reset to the first page whenever the period changes — synced during render
  // (not in an effect) against the previous params reference.
  const [prevParams, setPrevParams] = useState(params)
  if (params !== prevParams) {
    setPrevParams(params)
    setPage(1)
  }

  const { data, isLoading } = useTaxLedger(params, page, 20, enabled)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tax events in this period</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 border-b pb-1 text-xs text-muted-foreground">
              <span>Date</span>
              <span>Type</span>
              <span>Reference</span>
              <span className="text-right">Tax</span>
            </div>
            <div className="divide-y">
              {data.items.map((e, i) => (
                <div key={i} className="grid grid-cols-4 items-center gap-2 py-2 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(e.date), 'dd MMM yyyy')}
                  </span>
                  <span className={e.direction === 'output' ? 'text-blue-600' : 'text-orange-600'}>
                    {KIND_LABEL[e.kind] ?? e.kind}
                  </span>
                  <span className="font-mono text-xs">{e.reference}</span>
                  <span
                    className={`text-right font-medium tabular-nums ${
                      e.isReturn ? 'text-red-600' : ''
                    }`}
                  >
                    {e.isReturn ? '-' : ''}
                    {formatCurrency(e.taxAmount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 text-sm">
              <span className="text-muted-foreground">
                Page {data.page} of {data.totalPages || 1} · {data.total} events
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
