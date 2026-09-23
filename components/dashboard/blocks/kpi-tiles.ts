// coding-standard: maintained
import {
  ArrowDownToLine,
  Clock,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Truck,
  TrendingUp,
  Wallet,
  CalendarClock,
} from 'lucide-react'
import type { StatData } from '@ui/components/StatsCard'
import type { Translator } from '@/i18n/config'
import { calcPeriodChange, type PeriodChange } from '@/utils/period-change'
import type { DashboardBlockContext, DashboardBlockId } from './context'

/**
 * The KPI row's tiles.
 *
 * Descriptors rather than components, because all four render inside ONE
 * `StatsCard` — it owns the responsive track, and four separate cards would not
 * line up. The renderer collects a run of `kpi` blocks and hands their
 * descriptors over together.
 *
 * A builder returning `null` means "no tile from me this render" (no data yet);
 * it does not mean the block was gated off — that decision was already made by
 * the server.
 */
type KpiTileBuilder = (
  ctx: DashboardBlockContext,
  t: Translator,
) => StatData | null

/**
 * A period with no trend gets no chip.
 *
 * `calcPeriodChange` returns `null` both for a flat period and — the case this
 * replaced — for a previous period of ZERO. The old local helper called that
 * 100% growth, so a workspace in its first month of trading wore an "↑ 100%"
 * chip on every KPI tile, against nothing.
 */
const trend = (
  change: PeriodChange | null,
  t: Translator,
): StatData['trend'] =>
  change
    ? {
        value: `${change.value}%`,
        direction: change.direction,
        label: t('vsPrevious'),
      }
    : undefined

export const KPI_TILES: Partial<Record<DashboardBlockId, KpiTileBuilder>> = {
  /**
   * Delivery charged against what it cost to carry.
   *
   * Not extra revenue — the charge is already inside the orders tile, because an
   * order's total includes it. This is the tile that says how much of that was
   * carriage and what carrying it took back, which for cash-on-delivery trade is
   * the largest cost after the goods themselves.
   */
  'shipping.money': ({ overview, formatCurrency }, t) => {
    if (!overview?.shipping) return null
    const { charged, cost, margin } = overview.shipping
    return {
      label: t('deliveryMargin'),
      value: formatCurrency(margin),
      description: t('deliveryChargedCost', {
        charged: formatCurrency(charged),
        cost: formatCurrency(cost),
      }),
      icon: Truck,
      variant: margin >= 0 ? 'success' : 'warning',
    }
  },

  /** A balance — what is in the drawer and the bank right now. */
  'cash.position': ({ overview, formatCurrency }, t) => {
    if (!overview?.cash) return null
    return {
      label: t('cashOnHand'),
      value: formatCurrency(overview.cash.balance),
      description: t('acrossAccounts', { count: overview.cash.accounts }),
      icon: Wallet,
      variant: 'info',
    }
  },

  /** Stock with a clock on it — the pharmacy counter's first question. */
  'stock.expiry': ({ overview }, t) => {
    if (!overview?.expiry) return null
    const { expiringLots, expiredLots, horizonDays } = overview.expiry
    return {
      label: t('expiringSoon'),
      value: expiringLots,
      description: t('expiryBreakdown', {
        expired: expiredLots,
        days: horizonDays,
      }),
      icon: CalendarClock,
      variant: expiredLots > 0 ? 'warning' : 'info',
    }
  },

  /**
   * Orders PLACED in the period — the online half of the revenue clock.
   *
   * Order-dated, and the subtitle says so. A storefront order becomes a Sale
   * only at dispatch, so a shop that took forty orders today and shipped none
   * had a full day's trade and a ৳0 revenue tile; this is the tile that answers
   * what they actually did.
   */
  'orders.summary': ({ overview, formatCurrency }, t) => {
    if (!overview?.orders) return null
    const { placed, value, previousPlaced } = overview.orders
    return {
      label: t('ordersPlaced'),
      value: placed,
      description: t('ordersValue', { amount: formatCurrency(value) }),
      icon: ShoppingBag,
      variant: 'primary',
      trend: trend(calcPeriodChange(placed, previousPlaced), t),
    }
  },

  /**
   * The queue. Deliberately ignores the period filter — "12 awaiting
   * confirmation" is true right now whatever dates are shown, the same way the
   * receivable balance is, and windowing it would report an empty queue to a
   * shop with a week of unconfirmed orders.
   */
  'orders.pipeline': ({ overview }, t) => {
    if (!overview?.ordersPipeline) return null
    const { pending, open } = overview.ordersPipeline
    return {
      label: t('awaitingConfirmation'),
      value: pending,
      description: t('ordersInFlight', { count: open }),
      icon: Clock,
      variant: pending > 0 ? 'warning' : 'info',
    }
  },

  /**
   * COD a courier has NOT handed over yet, and how much of it comes back.
   *
   * "Awaiting collection", not "with couriers" — the payouts page has its own
   * figure called **COD held by couriers**, and the two are complements rather
   * than the same money: this one is parcels whose Sale is still due (nobody has
   * collected), that one is cash the rider took and the courier has not remitted.
   * They were both called "with couriers" and a merchant reading ৳82,375 here and
   * ৳28,040 there had no way to tell they were two different questions.
   */
  'orders.cod': ({ overview, formatCurrency }, t) => {
    if (!overview?.ordersCod) return null
    const { inTransit, orders, rtoRate } = overview.ordersCod
    return {
      label: t('codInTransit'),
      value: formatCurrency(inTransit),
      // `rtoRate` is null until a parcel has reached a door — a shop with no
      // outcomes has no rate, and printing 0% would report a flawless week.
      description:
        rtoRate == null
          ? t('codOrders', { count: orders })
          : t('codOrdersWithRto', {
              count: orders,
              rate: Math.round(rtoRate * 100),
            }),
      icon: Truck,
      variant: 'info',
    }
  },

  /**
   * Revenue, NET of refunds, against a previous period that is also net.
   * Comparing this period after refunds with last period before them invents a
   * swing out of nothing — a quiet month following a month with one big refund
   * reads as growth.
   *
   * The refund is disclosed under the tile rather than netted away silently: for
   * cash-on-delivery trade a refused parcel is a KPI, and a merchant whose
   * revenue halved needs the page to say why.
   */
  'revenue.summary': ({ overview, formatCurrency }, t) => {
    if (!overview) return null
    const returned = overview.returns?.refund ?? 0
    // Both channels, each on its own clock: counter sales when they rang, online
    // orders on the day they were placed. Named in the subtitle, because a
    // merchant who can see both tiles must be able to see why they differ.
    const combined = !!overview.orders
    return {
      label: t('salesRevenue'),
      value: formatCurrency(overview.netRevenue ?? 0),
      description:
        returned > 0
          ? t('afterReturns', { amount: formatCurrency(returned) })
          : combined
            ? t('bothChannels')
            : undefined,
      icon: DollarSign,
      variant: 'success',
      trend: trend(
        calcPeriodChange(overview.netRevenue ?? 0, overview.previousNetRevenue ?? 0),
        t,
      ),
    }
  },

  'purchases.summary': ({ overview, formatCurrency }, t) => {
    if (!overview) return null
    return {
      label: t('purchaseCost'),
      value: formatCurrency(overview.purchases?.total ?? 0),
      icon: ArrowDownToLine,
      variant: 'info',
      trend: trend(
        calcPeriodChange(
          overview.purchases?.total ?? 0,
          overview.purchases?.previousTotal ?? 0,
        ),
        t,
      ),
    }
  },

  /**
   * Gross profit headlines here rather than inside Financial Insights: it is the
   * number a merchant opens the page for. The panel keeps the rates and averages.
   *
   * Margin is of NET revenue — `grossProfit` already has returns taken off both
   * revenue and COGS, so dividing by the gross `sales.total` understates it and
   * disagrees with the Profit & Loss report for the same period.
   */
  'profit.summary': ({ overview, formatCurrency }, t) => {
    if (!overview) return null
    const coverage = overview.costCoverage
    const known = coverage?.knownRevenue ?? 0
    const unknown = coverage?.unknownRevenue ?? 0

    /**
     * Nothing has a cost behind it — so there is no margin to print.
     *
     * A stock-free merchant who skipped the cost field at product create has no
     * receive path that would ever fill it in, so COGS stays 0 forever and the
     * margin reads a confident 100%. Say what is missing instead.
     */
    if (coverage && known <= 0) {
      return {
        label: t('grossProfit'),
        value: '—',
        icon: TrendingUp,
        variant: 'warning',
        description: t('costsMissing'),
      }
    }

    const grossProfit = overview.grossProfit ?? 0
    /**
     * Margin is of the KNOWN slice, so the numerator has to be that slice's
     * profit too — not the page headline.
     *
     * `grossProfit` is `netRevenue - COGS - carriage` over the WHOLE period, and
     * revenue with no cost behind it enters it at full value. Dividing that by
     * `known` mixes scopes and prints a margin above 100% (a sample workspace
     * read 133%). `grossProfit - unknown` is exactly
     * `known - COGS - carriage`, which is what this denominator is a margin of.
     */
    const knownProfit = grossProfit - unknown
    const margin = known > 0 ? Math.round((knownProfit / known) * 100) : 0
    return {
      label: t('grossProfit'),
      value: formatCurrency(grossProfit),
      icon: TrendingUp,
      variant: grossProfit >= 0 ? 'success' : 'warning',
      description:
        unknown > 0
          ? t('marginOfKnown', {
              margin,
              known: formatCurrency(known),
              total: formatCurrency(overview.netRevenue ?? 0),
            })
          : t('marginOfSales', { margin }),
    }
  },

  /**
   * Sales plus purchases when the merchant buys from suppliers, sales alone when
   * they do not — a total that silently means "sales, but stated oddly" is worse
   * than a smaller total, and the breakdown line would name a half they have no
   * such thing as. Read off the block list rather than a flag, because that list
   * IS the answer to "does this business have purchases".
   */
  'transactions.count': ({ overview, blocks }, t) => {
    if (!overview) return null
    const purchasesTracked = blocks.includes('purchases.summary')
    return {
      label: t('transactions'),
      value: purchasesTracked
        ? (overview.sales?.count ?? 0) + (overview.purchases?.count ?? 0)
        : (overview.sales?.count ?? 0),
      icon: ShoppingCart,
      variant: 'primary',
      description: purchasesTracked
        ? t('salesPurchaseCount', {
            sales: overview.sales?.count ?? 0,
            purchases: overview.purchases?.count ?? 0,
          })
        : undefined,
    }
  },
}
