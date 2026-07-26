'use client'
// coding-standard: maintained

import { useEffect, useMemo, useState } from 'react'

import { useProductBatches } from '@/services/api'
import type { BatchDraw } from '@/services/stores/stock-adjustment-store'
import type { ProductBatch } from '@/types/api'

interface UseBatchDrawsArgs {
  productId?: string
  variantId?: string | null
  /** Units being removed (positive). 0 when the row isn't decreasing. */
  removedQuantity: number
  /** Only fetch for an expiry-tracked product that is actually decreasing. */
  enabled: boolean
  /**
   * Draws already saved on the item being edited. Re-opening a pending row
   * restores the split the user chose instead of silently snapping it back to
   * FEFO — but only while it still balances, since a changed quantity makes the
   * old split meaningless.
   */
  presetDraws?: BatchDraw[]
}

/**
 * Spread `quantity` across lots earliest-expiry-first. The API already returns
 * batches FEFO-ordered, so this walks them in place rather than re-sorting —
 * re-sorting client-side would silently diverge from the server's idea of FEFO.
 */
function allocateFefo(batches: ProductBatch[], quantity: number): Record<string, number> {
  const draws: Record<string, number> = {}
  let left = quantity

  for (const batch of batches) {
    if (left <= 0) break
    const take = Math.min(left, batch.remainingQuantity)
    if (take > 0) {
      draws[batch._id] = take
      left -= take
    }
  }

  return draws
}

/**
 * Batch-draw allocation for decreasing an expiry-tracked product.
 *
 * The backend requires the draws to sum **exactly** to the removed quantity
 * (`ADJUST_BATCH_DRAWS_MISMATCH`) and rejects a draw larger than a lot's
 * remaining stock (`INSUFFICIENT_BATCH_STOCK`). Both are mirrored here so the
 * user is stopped at the form rather than by a failed submit halfway through a
 * bulk adjustment.
 *
 * Defaults to FEFO because that is what a write-off almost always means — the
 * oldest stock is the spoiled stock. The user can then move quantity between
 * lots by hand, e.g. when the damaged carton is a later one.
 */
export function useBatchDraws({
  productId,
  variantId,
  removedQuantity,
  enabled,
  presetDraws,
}: UseBatchDrawsArgs) {
  const query = useProductBatches(
    productId ?? '',
    variantId ? { variantId } : {},
    { enabled: enabled && !!productId },
  )

  const batches = useMemo(() => query.data?.data ?? [], [query.data])
  const [draws, setDraws] = useState<Record<string, number>>({})

  // Re-seed whenever the lot set, the amount being removed, or the edited row
  // changes: a changed quantity invalidates the whole split, so keeping the old
  // numbers would leave a silently unbalanced form. Identity is the joined ids,
  // not the array, so a refetch returning equal data doesn't wipe manual edits.
  const batchKey = batches.map((b) => b._id).join(',')
  const presetKey = (presetDraws ?? []).map((d) => `${d.batchId}:${d.quantity}`).join(',')
  useEffect(() => {
    const preset = presetDraws ?? []
    const presetTotal = preset.reduce((sum, d) => sum + d.quantity, 0)
    setDraws(
      presetTotal > 0 && presetTotal === removedQuantity
        ? Object.fromEntries(preset.map((d) => [d.batchId, d.quantity]))
        : allocateFefo(batches, removedQuantity),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the id/preset strings, not array identity
  }, [batchKey, presetKey, removedQuantity])

  const setDraw = (batchId: string, quantity: number | null) => {
    setDraws((current) => ({ ...current, [batchId]: Math.max(0, quantity ?? 0) }))
  }

  const resetToFefo = () => setDraws(allocateFefo(batches, removedQuantity))

  const allocated = Object.values(draws).reduce((sum, qty) => sum + qty, 0)
  const availableTotal = batches.reduce((sum, b) => sum + b.remainingQuantity, 0)

  // Over-drawing a single lot is its own error: the totals can balance while an
  // individual draw still exceeds that lot, which the backend rejects.
  const hasOverdrawnLot = batches.some((b) => (draws[b._id] ?? 0) > b.remainingQuantity)

  return {
    batches,
    isLoading: query.isLoading,
    draws,
    setDraw,
    resetToFefo,
    allocated,
    remaining: removedQuantity - allocated,
    availableTotal,
    /** Not enough stock across all lots — the decrease itself is impossible. */
    insufficientStock: enabled && !query.isLoading && availableTotal < removedQuantity,
    hasOverdrawnLot,
    isBalanced: allocated === removedQuantity && !hasOverdrawnLot,
    /** Wire payload: drop zero-quantity lots, which the backend would reject. */
    toPayload: (): BatchDraw[] =>
      Object.entries(draws)
        .filter(([, quantity]) => quantity > 0)
        .map(([batchId, quantity]) => ({ batchId, quantity })),
  }
}
