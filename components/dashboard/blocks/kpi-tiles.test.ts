// coding-standard: maintained

import { describe, expect, it } from 'vitest'
import type { DashboardOverview } from '@/services/api'
import type { DashboardBlockContext } from './context'
import { KPI_TILES } from './kpi-tiles'

/**
 * The profit tile's margin, which browser QA caught reading **133%**.
 *
 * Since 2026-09-28 the server sends `grossProfit` as the KNOWN slice's profit
 * (revenue with no cost behind it, and those orders' carriage, left out), so the
 * headline and the margin share one scope. Before, uncosted revenue entered the
 * headline at full value and the ratio could run past 100 — or, with all the
 * period's carriage charged to a small known slice, below zero.
 *
 * `t` echoes its key and interpolations rather than rendering copy, so these
 * assert the NUMBER fed into the string; a prose assertion would pass on the
 * broken arithmetic just as happily.
 */
const t = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key) as never

const ctx = (overview: Partial<DashboardOverview>): DashboardBlockContext =>
  ({
    overview: overview as DashboardOverview,
    blocks: ['profit.summary'],
    isLoading: false,
    formatCurrency: (v: number) => `৳${v}`,
  }) as unknown as DashboardBlockContext

const profitTile = (overview: Partial<DashboardOverview>) =>
  KPI_TILES['profit.summary']!(ctx(overview), t)

describe('gross profit tile', () => {
  it('takes the margin over the known slice with that slice’s own profit', () => {
    // The shape browser QA hit: ৳444,463.52 net, of which ৳146,647.70 has no
    // cost behind it; ৳45,630 of goods and ৳3,840 of carriage against the rest.
    const tile = profitTile({
      netRevenue: 444463.52,
      grossProfit: 248345.82,
      costCoverage: {
        knownRevenue: 297815.82,
        unknownRevenue: 146647.7,
        unknownLines: 0,
        uncommittedOrders: 25,
      },
    } as never)

    // 297,815.82 - 45,630 - 3,840 = 248,345.82 → 83%, not 133%.
    expect(tile?.description).toContain('"margin":83')
    // The headline is that same slice's profit, and the copy names what was
    // left out instead of counting it as free goods.
    expect(tile?.value).toBe('৳248345.82')
    expect(tile?.description).toContain('"unknown":"৳146647.7"')
  })

  it('is a plain margin of net revenue when every line has a cost', () => {
    const tile = profitTile({
      netRevenue: 1000,
      grossProfit: 400,
      costCoverage: {
        knownRevenue: 1000,
        unknownRevenue: 0,
        unknownLines: 0,
        uncommittedOrders: 0,
      },
    } as never)

    expect(tile?.description).toBe('marginOfSales:{"margin":40}')
  })

  it('prints no margin at all when nothing is costed', () => {
    // A 100% margin is a worse answer than an absent one — the merchant who
    // skipped the cost field would read it as a shop that pays nothing.
    const tile = profitTile({
      netRevenue: 2000,
      grossProfit: 2000,
      costCoverage: {
        knownRevenue: 0,
        unknownRevenue: 2000,
        unknownLines: 0,
        uncommittedOrders: 0,
      },
    } as never)

    expect(tile?.value).toBe('—')
    expect(tile?.description).toBe('costsMissing')
  })

  it('says profit waits for dispatch when only undispatched orders are uncosted', () => {
    // A storefront day where nothing has shipped yet: no cost price is missing,
    // so "set cost prices" would send the merchant to fix nothing.
    const tile = profitTile({
      netRevenue: 14520,
      grossProfit: 0,
      costCoverage: {
        knownRevenue: 0,
        unknownRevenue: 14520,
        unknownLines: 0,
        uncommittedOrders: 10,
      },
    } as never)

    expect(tile?.value).toBe('—')
    expect(tile?.description).toBe('costsPending')
  })
})
