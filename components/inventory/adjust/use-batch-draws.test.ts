// coding-standard: maintained
/**
 * Draw allocation for a stock decrease.
 *
 * The case worth pinning is the **unknown-expiry lot** (`expiryDate: null`).
 * Plan step 23 asks that when it is the only lot, the adjustment form
 * pre-selects it rather than showing an empty picker — that empty picker, on
 * exactly this kind of stock, is the bug the whole batch-ledger plan exists to
 * fix. The allocation below already satisfies it, and this test is what stops a
 * future change to the ordering from quietly breaking it again.
 *
 * The second property is ordering: a null expiry sorts **last**, never first.
 * `new Date(null)` is the Unix epoch, so any sort that forgets the null guard
 * ranks undated stock as the most urgent thing in the building.
 */
import { describe, expect, it } from 'vitest'

import { allocateDraws, orderForWriteOff } from './use-batch-draws'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'

const DAY = 24 * 60 * 60 * 1000
const daysFromNow = (days: number) =>
  new Date(Date.now() + days * DAY).toISOString()

const lot = (
  _id: string,
  remainingQuantity: number,
  expiryDate: string | null,
): BatchRow => ({ _id, remainingQuantity, expiryDate })

describe('orderForWriteOff', () => {
  it('puts expired lots first — a decrease is usually clearing what went off', () => {
    const fresh = lot('fresh', 10, daysFromNow(30))
    const expired = lot('expired', 10, daysFromNow(-2))

    expect(orderForWriteOff([fresh, expired]).map((b) => b._id)).toEqual([
      'expired',
      'fresh',
    ])
  })

  it('puts the unknown-expiry lot last, never first', () => {
    const unknown = lot('unknown', 10, null)
    const soon = lot('soon', 10, daysFromNow(5))
    const late = lot('late', 10, daysFromNow(90))

    expect(orderForWriteOff([unknown, late, soon]).map((b) => b._id)).toEqual([
      'soon',
      'late',
      'unknown',
    ])
  })

  it('never treats a null expiry as expired', () => {
    const unknown = lot('unknown', 10, null)
    const expired = lot('expired', 10, daysFromNow(-2))

    expect(orderForWriteOff([unknown, expired]).map((b) => b._id)).toEqual([
      'expired',
      'unknown',
    ])
  })
})

describe('allocateDraws', () => {
  it('#23 pre-selects the unknown lot when it is the only one', () => {
    const draws = allocateDraws([lot('unknown', 150, null)], 50)

    expect(draws).toEqual([
      {
        batchId: 'unknown',
        quantity: 50,
        expiryDate: null,
        batchNumber: undefined,
        expired: false,
      },
    ])
  })

  it('fills across lots in write-off order, stopping once satisfied', () => {
    const draws = allocateDraws(
      [lot('fresh', 100, daysFromNow(30)), lot('expired', 20, daysFromNow(-1))],
      35,
    )

    expect(draws.map((d) => [d.batchId, d.quantity])).toEqual([
      ['expired', 20],
      ['fresh', 15],
    ])
  })

  it('allocates only what the lots hold, leaving the rest short', () => {
    // The form reads this as unbalanced and blocks submit, rather than sending
    // draws that do not add up — which the server would reject anyway.
    const draws = allocateDraws([lot('unknown', 10, null)], 25)

    expect(draws.reduce((sum, d) => sum + d.quantity, 0)).toBe(10)
  })

  it('takes nothing from a depleted lot', () => {
    const draws = allocateDraws(
      [lot('empty', 0, null), lot('stocked', 10, daysFromNow(30))],
      5,
    )

    expect(draws.map((d) => d.batchId)).toEqual(['stocked'])
  })
})
