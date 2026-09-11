// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Globe } from 'lucide-react'
import type { ProductDetail } from '@/types/api'

interface DetailStorefrontProps {
  // The backend's real storefront shape (from the generated API types), so this can't drift
  // from what `/products/:id` sends. The parent guards `product.storefront` before rendering.
  storefront: NonNullable<ProductDetail['storefront']>
  formatCurrency: (n: number) => string
}

export function DetailStorefront({ storefront, formatCurrency }: DetailStorefrontProps) {
  const t = useTranslations('products.products.detail.storefront')
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-emerald-600" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('listed')}</span>
            <Badge variant={storefront.isListed ? 'default' : 'secondary'}>
              {storefront.isListed ? t('yes') : t('no')}
            </Badge>
          </div>
          {storefront.featured && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{t('featured')}</span>
              <Badge className="bg-amber-100 text-amber-700">{t('featured')}</Badge>
            </div>
          )}
          {storefront.onlinePrice != null && storefront.onlinePrice > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{t('onlinePrice')}</span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(storefront.onlinePrice)}
              </span>
            </div>
          )}
          {/* No online description row: the shop copy is the product's own
              `description`, rendered by the Info card above. */}
        </div>
      </CardContent>
    </Card>
  )
}
