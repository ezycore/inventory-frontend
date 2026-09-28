'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import EmptyState from '@ui/components/EmptyState'
import { ShoppingCart, Trophy } from 'lucide-react'
import type { DashboardOverview } from '@/services/api'

type TopSoldRow = Pick<
  NonNullable<DashboardOverview['topSoldItems']>[number],
  'productName' | 'variantName' | 'totalQuantity' | 'totalRevenue' | 'profit'
>

interface TopSoldItemsProps {
  items?: TopSoldRow[]
  isLoading: boolean
  formatCurrency: (v: number) => string
  /**
   * Whose best sellers these are, which decides the words: `sales` for a POS
   * shop, `counter` for the POS half of a shop that also takes orders, `orders`
   * for the list counted from orders — no "sale" wording for a storefront
   * seller (docs/plan/orders-first-storefront.md).
   */
  variant?: 'sales' | 'counter' | 'orders'
}

const NAMESPACE = {
  sales: 'dashboard.topSold',
  counter: 'dashboard.topCounter',
  orders: 'dashboard.topOrdered',
} as const

export function TopSoldItems({
  items,
  isLoading,
  formatCurrency,
  variant = 'sales',
}: TopSoldItemsProps) {
  const t = useTranslations(NAMESPACE[variant])
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-chart-4" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-3 w-[90px]" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : (items || []).length > 0 ? (
          <div className="space-y-3">
            {items!.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.productName}
                      {item.variantName ? ` — ${item.variantName}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {/* No profit without `costs.view` or a known cost — absent,
                          never printed as ৳0. */}
                      {item.profit === undefined || item.profit === null
                        ? t('soldCount', { count: item.totalQuantity })
                        : t('soldProfit', {
                            count: item.totalQuantity,
                            amount: formatCurrency(item.profit),
                          })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {formatCurrency(item.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            compact
          />
        )}
      </CardContent>
    </Card>
  )
}
