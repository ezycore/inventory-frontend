'use client'
// coding-standard: maintained

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatInTimeZone } from 'date-fns-tz'
import { getOrgTimezone } from '@/hooks/use-org-calendar'
import type { ReportParams, TaxLedgerKind } from '@/services/api'
import { useTaxLedger } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Skeleton } from '@ui/components/skeleton'

/** TaxLedgerKind → `reports.tax.kind*` message key. */
const KIND_LABEL_KEYS: Record<TaxLedgerKind, string> = {
  sale: 'kindSale',
  sales_return: 'kindSalesReturn',
  purchase: 'kindPurchase',
  purchase_return: 'kindPurchaseReturn',
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
  const t = useTranslations('reports.tax')
  const [page, setPage] = useState(1)
  // Reset to the first page whenever the period changes (render-phase reset —
  // avoids setState-in-effect cascading renders).
  const [prevParams, setPrevParams] = useState(params)
  if (params !== prevParams) {
    setPrevParams(params)
    setPage(1)
  }

  const { data, isLoading } = useTaxLedger(params, page, 20, enabled)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('ledgerTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noTaxEvents')}</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 border-b pb-1 text-xs text-muted-foreground">
              <span>{t('colDate')}</span>
              <span>{t('colType')}</span>
              <span>{t('colReference')}</span>
              <span className="text-right">{t('colTax')}</span>
            </div>
            <div className="divide-y">
              {data.items.map((e, i) => (
                <div key={i} className="grid grid-cols-4 items-center gap-2 py-2 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {formatInTimeZone(new Date(e.date), getOrgTimezone(), 'dd MMM yyyy')}
                  </span>
                  <span className={e.direction === 'output' ? 'text-blue-600' : 'text-orange-600'}>
                    {KIND_LABEL_KEYS[e.kind] ? t(KIND_LABEL_KEYS[e.kind] as never) : e.kind}
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
                {t('pageOfEvents', { page: data.page, totalPages: data.totalPages || 1, total: data.total })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
