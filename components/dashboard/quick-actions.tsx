'use client'
// coding-standard: maintained

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import { Button } from '@ui/components/button'
import { cn } from '@ui/lib/utils'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  ArrowDownToLine,
  Package,
  Repeat,
  BarChart3,
  Eye,
  Receipt,
} from 'lucide-react'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { areAllFeaturesEnabled } from '@/lib/feature-utils'
import type { OrganizationFeatures } from '@/types'

/**
 * Quick actions are shortcuts to screens the sidebar already gates, so they
 * carry the SAME `features`/`permissions` rules as their nav counterparts in
 * `constants/navItem.ts`. Without this the dashboard hands an online-only shop
 * a "New Sale" button to a POS it disabled, and a single-location shop a
 * "Transfer Stock" button with nothing to transfer between — the exact entry
 * points onboarding removed from the nav.
 */
const ACTIONS: {
  labelKey: string
  icon: typeof ShoppingCart
  path: string
  color: string
  /** All must be enabled — mirrors `NavItem.features`. */
  features?: (keyof OrganizationFeatures)[]
  /** Any one grants access — mirrors `NavItem.permissions`. */
  permissions?: string[]
}[] = [
  {
    labelKey: 'newSale',
    icon: ShoppingCart,
    path: '/sales',
    color: 'text-primary',
    // `sales` is the POS counter itself, so unlike the Sales *group* this is
    // an all-of gate, matching the "New Sale" nav item.
    features: ['sales'],
    permissions: ['sales.create'],
  },
  {
    /**
     * The online seller's daily screen — confirm, pack, dispatch.
     *
     * Its absence was the other half of the storefront merchant's empty page:
     * onboarding removed the POS and purchasing shortcuts for them and put
     * nothing back, so a shop whose whole trade is online kept two of six
     * actions, neither of which was the one they open every morning.
     */
    labelKey: 'onlineOrders',
    icon: Receipt,
    path: '/ecommerce/orders',
    color: 'text-chart-1',
    features: ['storefront'],
    permissions: ['storefront.orders.view'],
  },
  {
    labelKey: 'purchase',
    icon: ArrowDownToLine,
    path: '/purchases',
    color: 'text-chart-2',
    // Was the only action with a nav counterpart that gates on `purchases` and
    // no gate of its own, so a storefront-only workspace got a shortcut onto a
    // screen its own route guard blocks (QA-C1).
    features: ['purchases'],
    permissions: ['purchases.create'],
  },
  {
    labelKey: 'addProduct',
    icon: Package,
    path: '/products',
    color: 'text-chart-4',
    permissions: ['products.create'],
  },
  {
    labelKey: 'transferStock',
    icon: Repeat,
    path: '/inventory/transfers',
    color: 'text-chart-5',
    // Nothing to transfer between when there is one location.
    features: ['multiLocation'],
    permissions: ['stock.manage'],
  },
  {
    labelKey: 'adjustStock',
    icon: BarChart3,
    path: '/inventory/adjust',
    color: 'text-chart-1',
    // Nothing to adjust when nothing is counted — the inventory rows a
    // stock-free workspace holds are inactive link records.
    features: ['inventoryTracking'],
    permissions: ['stock.manage'],
  },
  {
    labelKey: 'viewReports',
    icon: Eye,
    path: '/reports',
    color: 'text-muted-foreground',
    permissions: ['reports.view'],
  },
]

/**
 * Tailwind needs whole class names present in the source to emit them, so this
 * is a lookup rather than a `lg:grid-cols-${n}` template.
 */
const LG_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

export function QuickActions() {
  const router = useRouter()
  const t = useTranslations('dashboard.quickActions')
  const user = useAuthStore((state) => state.user)
  const features = user?.organization?.features
  const permissions = user?.permissions

  const actions = useMemo(
    () =>
      ACTIONS.filter((action) => {
        if (action.features && !areAllFeaturesEnabled(features, action.features))
          return false
        if (
          action.permissions &&
          !action.permissions.some((p) => permissions?.includes(p))
        )
          return false
        return true
      }),
    [features, permissions],
  )

  // Every shortcut gated away — render nothing rather than an empty card.
  if (actions.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Sized from what survives the gates, not from the six actions that
            exist. A storefront-only shop keeps two, and a 5-wide track left
            them huddled against three empty columns (QA-R3). */}
        <div
          className={cn(
            "grid gap-3 grid-cols-2 sm:grid-cols-3",
            LG_COLUMNS[Math.min(actions.length, 5)] ?? "lg:grid-cols-5",
          )}
        >
          {actions.map((action) => (
            <Button
              key={action.labelKey}
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 hover:shadow-sm transition-shadow"
              onClick={() => router.push(action.path)}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{t(action.labelKey)}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
