// coding-standard: maintained

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DashboardOverview } from '@/services/api'
import { FinancialInsights } from './financial-insights'

/**
 * The rates and averages under the revenue KPI — and the half of QA-N9 that was
 * easiest to miss.
 *
 * The panel divided by `sales.total`, the GROSS period figure, while the tile
 * above it printed net. On a workspace with one completed order at ৳1,450 and one
 * refused in full at ৳18,850 that read "Sales Collection 7% · ৳1,450 collected of
 * ৳20,300" — a progress bar telling a merchant who is owed nothing that ৳18,850
 * is outstanding, next to an average sale of ৳10,150 for a shop that took ৳1,450.
 *
 * `t` is mocked to echo its key and interpolations rather than render English, so
 * these assert the NUMBERS the panel feeds into the copy. A prose assertion would
 * pass just as happily on the gross ones.
 */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}))

const overview = (patch: Partial<DashboardOverview> = {}) =>
  ({
    sales: {
      total: 20300,
      paid: 1450,
      due: 0,
      count: 2,
      previousTotal: 0,
      previousCount: 0,
      byChannel: { pos: { total: 0, count: 0 }, online: { total: 1450, count: 2 } },
    },
    purchases: {
      total: 0,
      paid: 0,
      due: 0,
      count: 0,
      previousTotal: 0,
      previousCount: 0,
    },
    purchasesTracked: false,
    netRevenue: 1450,
    previousNetRevenue: 0,
    returns: { refund: 18850, cogs: 11050, count: 1 },
    ...patch,
  }) as unknown as DashboardOverview

const draw = (data: DashboardOverview) =>
  render(
    <FinancialInsights
      overview={data}
      isLoading={false}
      formatCurrency={(v) => `৳${v}`}
    />,
  )

describe('financial insights — rates read net, like the tile above them', () => {
  it('averages the sale over net revenue, not gross', () => {
    draw(overview())
    // ৳1,450 taken across 2 orders — NOT ৳20,300 ÷ 2.
    expect(screen.getByText('৳725')).toBeInTheDocument()
    expect(screen.queryByText('৳10150')).not.toBeInTheDocument()
  })

  it('counts the refunded order as an order that happened', () => {
    draw(overview())
    // The count stays gross: this is the field that answers how busy the shop
    // was, and netting it would flatter the average with the same money twice.
    expect(screen.getByText('salesCount:{"count":2}')).toBeInTheDocument()
  })

  it('keeps the printed count and the average on the same denominator', () => {
    // A review asked for the average to divide by orders that were not returned
    // (here: 1, giving ৳1,450). Declined and pinned — see the note in the
    // component. The count is rendered beside the value, so changing one
    // denominator without the other makes the tile contradict itself, and
    // "orders that were not returned" is undefined under partial returns.
    draw(overview())
    expect(screen.getByText('৳725')).toBeInTheDocument()
    expect(screen.getByText('salesCount:{"count":2}')).toBeInTheDocument()
    expect(screen.queryByText('৳1450')).not.toBeInTheDocument()
  })

  it('collects against what is still owed, not against refunded money', () => {
    draw(overview())
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(
      screen.getByText('collectedOfTotal:{"collected":"৳1450","total":"৳1450"}'),
    ).toBeInTheDocument()
  })

  it('clamps a collection rate that a cash refund pushed over 100%', () => {
    // Paid in full, then refunded in cash: `paid` stays behind while the
    // denominator drops. "145%" collected describes nothing actionable.
    draw(overview({ netRevenue: 1000, sales: { ...overview().sales, paid: 1450 } }))
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows 0% rather than dividing by a period with nothing left in it', () => {
    draw(overview({ netRevenue: 0 }))
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('৳0')).toBeInTheDocument()
  })
})
