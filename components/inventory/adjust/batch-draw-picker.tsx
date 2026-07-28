'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { AlertTriangle, CalendarClock, RotateCcw } from 'lucide-react'

import { Button } from '@/ui/components/button'
import { NumberField } from '@/ui/components/number-field'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { ExpiryBadge, isExpired } from '@/components/shared/expiry/expiry-badge'
import { formatDate } from '@/components/products/detail/utils'
import type { ProductBatch } from '@/types/api'
import type { useBatchDraws } from './use-batch-draws'

interface BatchDrawPickerProps {
  draws: ReturnType<typeof useBatchDraws>
  /** Units being removed — the number the draws must add up to. */
  removedQuantity: number
}

/**
 * "Which lots does this come out of?" — the batch split for decreasing an
 * expiry-tracked product.
 *
 * Pre-filled FEFO by `useBatchDraws`, so the common case (write off the oldest
 * stock) is zero clicks and the user only touches it to correct which carton
 * actually went. Drawing from a past-expiry lot is called out because the
 * backend books those as an expiry write-off rather than a plain adjustment —
 * the same units leave stock either way, but they land in different reports.
 */
export function BatchDrawPicker({ draws, removedQuantity }: BatchDrawPickerProps) {
  const t = useTranslations('inventory.adjust')
  const {
    batches,
    isLoading,
    draws: allocation,
    setDraw,
    resetToFefo,
    allocated,
    remaining,
    availableTotal,
    insufficientStock,
    isBalanced,
  } = draws

  const columns: SimpleColumn<ProductBatch>[] = [
    {
      key: 'batch',
      header: t('colBatch'),
      cellClassName: 'font-medium',
      cell: (b) => b.batchNumber || t('batchUnnumbered'),
    },
    {
      key: 'expiry',
      header: t('colExpiry'),
      cellClassName: 'text-muted-foreground',
      cell: (b) => formatDate(b.expiryDate),
    },
    {
      key: 'status',
      header: t('colStatus'),
      cell: (b) => <ExpiryBadge expiryDate={b.expiryDate} />,
    },
    {
      key: 'onHand',
      header: t('colOnHand'),
      align: 'right',
      cell: (b) => b.remainingQuantity.toLocaleString(),
    },
    {
      key: 'draw',
      header: t('colTakeFrom'),
      align: 'right',
      cell: (b) => (
        <NumberField
          value={allocation[b._id] ?? 0}
          onChange={(v) => setDraw(b._id, v)}
          min={0}
          max={b.remainingQuantity}
          precision={0}
          className="h-9 w-24 ml-auto"
          aria-label={t('drawFromBatch', { batch: b.batchNumber || t('batchUnnumbered') })}
        />
      ),
    },
  ]

  return (
    <div className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-amber-600" />
            {t('batchDrawTitle')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('batchDrawHint', { count: removedQuantity })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetToFefo} className="gap-1.5 shrink-0">
          <RotateCcw className="h-3.5 w-3.5" />
          {t('resetToFefo')}
        </Button>
      </div>

      {isLoading ? (
        <p className="py-2 text-sm text-muted-foreground">{t('batchesLoading')}</p>
      ) : batches.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{t('noBatches')}</p>
      ) : (
        <>
          <SimpleTable columns={columns} rows={batches} getRowKey={(b) => b._id} />

          {/* Running total: the backend requires an exact match, so show the
              gap continuously rather than failing only on submit. */}
          <div
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
              isBalanced
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            <span>{t('allocatedOf', { allocated, total: removedQuantity })}</span>
            {!isBalanced && (
              <span className="font-medium">
                {remaining > 0
                  ? t('stillToAllocate', { count: remaining })
                  : t('overAllocated', { count: Math.abs(remaining) })}
              </span>
            )}
          </div>

          {insufficientStock && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t('batchesInsufficient', { available: availableTotal, needed: removedQuantity })}
            </p>
          )}

          {batches.some((b) => isExpired(b.expiryDate) && (allocation[b._id] ?? 0) > 0) && (
            <p className="text-xs text-muted-foreground">{t('expiredDrawNote')}</p>
          )}
        </>
      )}
    </div>
  )
}
