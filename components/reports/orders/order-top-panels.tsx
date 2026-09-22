'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Package, Users } from 'lucide-react'
import type { OrdersReportData } from '@/services/api/modules/reports/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'

/**
 * What sold and who bought, on the order clock.
 *
 * Two things this card must not do, both of which the server already guards and
 * the markup has to honour:
 *
 * 1. **Never print a cost or profit the row does not carry.** The server omits
 *    those keys entirely when the caller lacks `costs.view` or when any unit on
 *    the product has no cost behind it — so `?? 0` here would reintroduce the
 *    exact lie the omission exists to prevent.
 * 2. **Show why a customer ranks where they do.** `grossSpent` and `refunded`
 *    ride along so a heavy returner's position is explainable rather than
 *    looking like a bug in the ordering.
 */
export function OrderTopProductsCard({
  data,
  formatCurrency,
}: {
  data: OrdersReportData
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.orders.topProducts')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            data.topProducts.map((product) => (
              <div
                key={product.productId ?? product.productName}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium">{product.productName}</span>
                  <span className="ml-2 text-muted-foreground">×{product.units}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-medium tabular-nums">
                    {formatCurrency(product.revenue)}
                  </span>
                  {/* Absent, not zero — see the note at the top of this file. */}
                  {product.profit !== undefined && (
                    <span className="ml-2 text-xs text-green-600 tabular-nums">
                      +{formatCurrency(product.profit)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function OrderTopCustomersCard({
  data,
  formatCurrency,
}: {
  data: OrdersReportData
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.orders.topCustomers')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            data.topCustomers.map((customer) => (
              <div
                key={customer.key ?? customer.name}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium">{customer.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t('orders', { count: customer.orders })}
                  </span>
                  {/* Guests are counted here like anyone else — merged on the
                      phone, which is how the rest of the product matches a
                      customer. Saying so explains a name with no account. */}
                  {!customer.hasAccount && (
                    <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {t('guest')}
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-medium tabular-nums">
                    {formatCurrency(customer.netSpent)}
                  </span>
                  {customer.refunded > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                      {t('refunded', { amount: formatCurrency(customer.refunded) })}
                    </span>
                  )}
                  {customer.outstanding > 0 && (
                    <span className="ml-2 text-xs text-red-500 tabular-nums">
                      {t('due', { amount: formatCurrency(customer.outstanding) })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
