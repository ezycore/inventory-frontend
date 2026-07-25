// coding-standard: maintained
import type { AdjustmentItem } from '@/services/stores/stock-adjustment-store'

/**
 * Per-base-unit cost used to value an adjustment. The entered cost wins when the
 * row had no basis yet (that's the only time it's set); otherwise the row's WAC.
 */
export const itemUnitCost = (item: AdjustmentItem): number =>
  item.costPrice ?? item.rowCostPrice ?? 0

/**
 * Signed value impact of one adjustment, **at cost** (not sale price):
 * `(newQuantity − currentQuantity) × unit cost`. Positive = value added.
 */
export const itemValueDelta = (item: AdjustmentItem): number =>
  (item.newQuantity - item.currentQuantity) * itemUnitCost(item)
