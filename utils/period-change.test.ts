// coding-standard: maintained
import { describe, expect, it } from 'vitest'

import { calcPeriodChange } from './period-change'

/**
 * The case that mattered is the first one: four copies of this helper reported a
 * previous period of zero as 100% growth, so a shop's first trading month showed
 * "↑ 100% vs previous period" under every tile.
 */
describe('calcPeriodChange', () => {
  it('returns null when there is no previous period to compare against', () => {
    // Not 100%. A first month of trading has no trend, and inventing one puts a
    // number with no basis on the page as though it were a fact.
    expect(calcPeriodChange(142_100, 0)).toBeNull()
  })

  it('returns null when both periods are empty', () => {
    expect(calcPeriodChange(0, 0)).toBeNull()
  })

  it('returns null when nothing moved', () => {
    // "0% vs previous period" spends a line to say nothing.
    expect(calcPeriodChange(5_000, 5_000)).toBeNull()
  })

  it('returns null when the move rounds away to nothing', () => {
    expect(calcPeriodChange(1_000.4, 1_000)).toBeNull()
  })

  it('reports growth as a positive percentage', () => {
    expect(calcPeriodChange(150, 100)).toEqual({ value: 50, direction: 'up' })
  })

  it('reports a fall as a positive percentage pointing down', () => {
    // The value is the magnitude; `direction` carries the sign, because the tile
    // renders an arrow beside it rather than a minus.
    expect(calcPeriodChange(50, 100)).toEqual({ value: 50, direction: 'down' })
  })

  it('reads a recovery from a loss as growth, not a fall', () => {
    // The P&L compares periods that can be negative. Dividing by a raw negative
    // previous flips the sign, so a loss shrinking from −১,০০০ to −৫০০ would
    // report as a fall. `Math.abs` on the denominator is what keeps it honest.
    expect(calcPeriodChange(-500, -1_000)).toEqual({ value: 50, direction: 'up' })
  })

  it('reads a deepening loss as a fall', () => {
    expect(calcPeriodChange(-1_500, -1_000)).toEqual({ value: 50, direction: 'down' })
  })
})
