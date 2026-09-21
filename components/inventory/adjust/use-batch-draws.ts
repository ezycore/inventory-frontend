// coding-standard: maintained
import { useCallback, useMemo, useState } from 'react'
import { useProductBatches } from '@/services/api'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import { isBatchExpired } from '@/components/shared/batch-select'
import { useOrgCalendar } from '@/hooks/use-org-calendar'
import type { BatchDraw } from '@/services/stores/stock-adjustment-store'

/**
 * Order lots for a write-off: expired first, then earliest-expiry (FEFO).
 * A decrease of expiry-tracked stock is nearly always clearing what has gone
 * off, so the stock the user came to remove is already selected. "Expired" is
 * decided on the organization's calendar (`timezone`), like the server.
 */
export function orderForWriteOff(batches: BatchRow[], timezone: string): BatchRow[] {
  const byExpiry = [...batches].sort((a, b) => {
    const left = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity
    const right = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity
    return left - right
  })
  return [
    ...byExpiry.filter((b) => isBatchExpired(b, timezone)),
    ...byExpiry.filter((b) => !isBatchExpired(b, timezone)),
  ]
}

/** Fill `quantity` units from the given lots in order, stopping when satisfied. */
export function allocateDraws(
  batches: BatchRow[],
  quantity: number,
  timezone: string,
): BatchDraw[] {
  const draws: BatchDraw[] = []
  let left = quantity

  for (const batch of orderForWriteOff(batches, timezone)) {
    if (left <= 0) break
    const take = Math.min(batch.remainingQuantity, left)
    if (take <= 0) continue
    left -= take
    draws.push({
      batchId: batch._id,
      quantity: take,
      expiryDate: batch.expiryDate ?? null,
      batchNumber: batch.batchNumber,
      expired: isBatchExpired(batch, timezone),
    })
  }

  return draws
}

interface UseBatchDrawsArgs {
  productId?: string
  variantId?: string | null
  /** Expiry-tracked product AND the adjustment is a decrease. */
  enabled: boolean
  /** Units being removed — what the draws have to add up to. */
  removedQuantity: number
}

/**
 * Owns the per-lot breakdown of a stock decrease: loads the product's in-stock
 * lots, keeps a suggested allocation in step with the quantity typed, and stops
 * suggesting once the user edits the rows by hand.
 */
export function useBatchDraws({
  productId,
  variantId,
  enabled,
  removedQuantity,
}: UseBatchDrawsArgs) {
  // Null while the rows are still the suggestion. Editing a row pins them, so
  // typing a new quantity afterwards never overwrites the user's own split.
  const [override, setOverride] = useState<BatchDraw[] | null>(null)
  const { timezone } = useOrgCalendar()

  const { data } = useProductBatches(
    productId || '',
    { ...(variantId ? { variantId } : {}) },
    { enabled: enabled && !!productId },
  )
  const batches = useMemo(() => (data?.data as BatchRow[]) || [], [data])

  // Derived, not stored — the suggestion follows the quantity for free.
  const suggested = useMemo(
    () =>
      enabled && removedQuantity > 0
        ? allocateDraws(batches, removedQuantity, timezone)
        : [],
    [enabled, removedQuantity, batches, timezone],
  )

  const draws = override ?? suggested

  const setDraws = useCallback((next: BatchDraw[]) => setOverride(next), [])

  /** Hand back to the suggestion (new product), or pin saved rows (edit). */
  const resetDraws = useCallback(
    (next: BatchDraw[] = []) => setOverride(next.length > 0 ? next : null),
    [],
  )

  const allocated = draws.reduce((sum, d) => sum + (d.quantity || 0), 0)

  return {
    draws,
    setDraws,
    resetDraws,
    batches,
    allocated,
    isBalanced: allocated === removedQuantity,
  }
}
