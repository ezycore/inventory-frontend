'use client'
// coding-standard: maintained

import type { ComponentType } from 'react'
import { ChartSection } from '@/components/dashboard/chart-section'
import { TopSoldItems } from '@/components/dashboard/top-sold-items'
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts'
import { ActivitySection } from '@/components/dashboard/activity-section'
import { FinancialInsights } from '@/components/dashboard/financial-insights'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { OrderFulfillment, StoreHealth } from './order-panels'
import {
  ChannelMixCard,
  PayablesCard,
  ReceivablesCard,
  StockValueCard,
} from './stat-cards'
import type {
  DashboardBlockContext,
  DashboardBlockId,
  DashboardBlockLayout,
} from './context'

/**
 * What each block id renders as, and how it sits on the page.
 *
 * **This map holds no gate.** Whether a block belongs to a workspace is decided
 * by the backend registry (`services/dashboard/blocks.ts`) and arrives as
 * `overview.blocks`; this only says what to draw. An id with no entry here is
 * skipped by the renderer, so the backend can ship a new block ahead of the
 * frontend that draws it.
 *
 * Adding a block: one backend registry row, one entry here.
 */
interface DashboardBlockView {
  layout: DashboardBlockLayout
  /** Absent for `kpi` blocks — those are descriptors in `kpi-tiles.ts`. */
  Component?: ComponentType<DashboardBlockContext>
}

export const DASHBOARD_BLOCK_VIEWS: Partial<
  Record<DashboardBlockId, DashboardBlockView>
> = {
  // KPI row — rendered from `KPI_TILES`, collected into one StatsCard.
  // Orders lead it for a shop whose trade is online; the server decides whether
  // they are on the page at all, and in what order.
  'orders.summary': { layout: 'kpi' },
  'orders.pipeline': { layout: 'kpi' },
  'orders.cod': { layout: 'kpi' },
  'revenue.summary': { layout: 'kpi' },
  'purchases.summary': { layout: 'kpi' },
  'profit.summary': { layout: 'kpi' },
  'transactions.count': { layout: 'kpi' },

  'chart.revenue': {
    layout: 'full',
    Component: ({ overview, isLoading, formatCurrency, blocks }) => (
      <ChartSection
        overview={overview}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
        showPurchases={blocks.includes('purchases.summary')}
        showOrders={blocks.includes('orders.summary')}
        showSales={blocks.includes('revenue.summary')}
      />
    ),
  },

  receivables: { layout: 'stat', Component: ReceivablesCard },
  payables: { layout: 'stat', Component: PayablesCard },
  'stock.value': { layout: 'stat', Component: StockValueCard },
  'revenue.channelMix': { layout: 'stat', Component: ChannelMixCard },

  'orders.fulfillment': { layout: 'half', Component: OrderFulfillment },
  topSold: {
    layout: 'half',
    Component: ({ overview, isLoading, formatCurrency, blocks }) => (
      <TopSoldItems
        items={overview?.topSoldItems}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
        // Beside the orders panel this list is the counter half.
        variant={blocks.includes('orders.topProducts') ? 'counter' : 'sales'}
      />
    ),
  },
  'orders.topProducts': {
    layout: 'half',
    Component: ({ overview, isLoading, formatCurrency }) => (
      <TopSoldItems
        items={overview?.ordersTopProducts?.map((row) => ({
          productName: row.productName,
          variantName: null,
          totalQuantity: row.units,
          totalRevenue: row.revenue,
          profit: row.profit,
        }))}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
        variant="orders"
      />
    ),
  },
  'stock.alerts': {
    layout: 'half',
    Component: ({ overview, isLoading }) => (
      <LowStockAlerts lowStock={overview?.lowStock} isLoading={isLoading} />
    ),
  },
  'stock.movements': {
    layout: 'half',
    Component: ({ stockMovements, movementsLoading }) => (
      <ActivitySection
        stockMovements={stockMovements}
        isLoading={movementsLoading}
      />
    ),
  },
  'financial.insights': {
    layout: 'half',
    Component: ({ overview, isLoading, formatCurrency, blocks }) => (
      <FinancialInsights
        overview={overview}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
        showPurchases={blocks.includes('purchases.summary')}
      />
    ),
  },
  'shipping.money': { layout: 'kpi' },
  'cash.position': { layout: 'kpi' },
  'stock.expiry': { layout: 'kpi' },

  'orders.recent': { layout: 'half', Component: () => <RecentOrders /> },
  'store.health': { layout: 'half', Component: () => <StoreHealth /> },

  'actions.quick': { layout: 'full', Component: () => <QuickActions /> },
}
