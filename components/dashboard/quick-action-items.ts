// coding-standard: maintained
import {
  ArrowDownToLine,
  BarChart3,
  Package,
  Palette,
  ShoppingCart,
  SquarePlus,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { POS_PATH } from '@/constants/pos'
import type { DashboardOverview } from '@/services/api'
import type { OrganizationFeatures } from '@/types'

/**
 * The dashboard shortcuts. Each is an entry point onto a screen the sidebar
 * already gates, so it carries the SAME `features`/`permissions` rules as its
 * nav counterpart in `constants/navItem.ts`. Without that the dashboard hands
 * an online-only shop a "New Sale" button to a POS it disabled.
 */
export type QuickActionId =
  | 'newSale'
  | 'onlineOrders'
  | 'addProduct'
  | 'newPurchase'
  | 'customers'
  | 'lowStock'
  | 'customizeStore'
  | 'reports'

export interface QuickAction {
  id: QuickActionId
  icon: typeof ShoppingCart
  path: string
  /** All must be enabled — mirrors `NavItem.features`. */
  features?: (keyof OrganizationFeatures)[]
  /** Any one grants access — mirrors `NavItem.permissions`. */
  permissions?: string[]
  /** Icon tile tint, light + dark. Whole class names so Tailwind emits them. */
  tint: string
}

/**
 * The big tiles: the screen a shop opens every morning. A counter shop's is the
 * POS, an online shop's is its order queue, a shop doing both gets both.
 */
export const PRIMARY_ACTIONS: QuickAction[] = [
  {
    id: 'newSale',
    icon: ShoppingCart,
    path: POS_PATH,
    // `sales` is the POS counter itself — an all-of gate, like the nav item.
    features: ['sales'],
    permissions: ['sales.create'],
    tint: 'bg-primary text-primary-foreground',
  },
  {
    id: 'onlineOrders',
    icon: Package,
    path: '/ecommerce/orders',
    features: ['storefront'],
    permissions: ['storefront.orders.view'],
    tint: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
]

/**
 * Daily, not occasional. Transfer and Adjust Stock were dropped from here: they
 * are a few-times-a-month task and diluted the row the owner actually scans.
 * They stay one click away in the sidebar.
 */
export const SECONDARY_ACTIONS: QuickAction[] = [
  {
    id: 'addProduct',
    icon: SquarePlus,
    path: '/products',
    permissions: ['products.create'],
    tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  {
    id: 'newPurchase',
    icon: ArrowDownToLine,
    path: '/purchases',
    // A storefront-only workspace's route guard blocks this screen (QA-C1).
    features: ['purchases'],
    permissions: ['purchases.create'],
    tint: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
  {
    id: 'customers',
    icon: Users,
    path: '/customers',
    permissions: ['customers.view'],
    tint: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  {
    id: 'lowStock',
    icon: TriangleAlert,
    path: '/inventory/lowstock',
    // Nothing runs low when nothing is counted.
    features: ['inventoryTracking'],
    permissions: ['stock.view'],
    tint: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    id: 'customizeStore',
    icon: Palette,
    path: '/ecommerce/customize',
    features: ['storefront'],
    permissions: ['storefront.design'],
    tint: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  },
  {
    id: 'reports',
    icon: BarChart3,
    path: '/reports',
    permissions: ['reports.view'],
    tint: 'bg-muted text-muted-foreground',
  },
]

/**
 * Live counts for the badges, read from the overview the page already fetched.
 *
 * Each figure is present only when the server admitted the block that carries
 * it (`orders.pipeline`, `stock.alerts`), so a caller who cannot see the queue
 * gets no number rather than a zero. Both are period-independent — "12 to
 * confirm" is true now whatever dates the filter shows.
 */
export const quickActionCounts = (
  overview?: DashboardOverview,
): Partial<Record<QuickActionId, number>> => ({
  onlineOrders: overview?.ordersPipeline?.pending,
  lowStock: overview?.lowStock
    ? overview.lowStock.count + overview.lowStock.outOfStockCount
    : undefined,
})

/** The POS opens in its own tab so the till stays up beside the admin. */
export const quickActionLinkProps = (action: QuickAction) =>
  action.path === POS_PATH
    ? { href: action.path, target: '_blank', rel: 'noopener noreferrer' }
    : { href: action.path }
