// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { StatusBadge } from '@/ui/components/status-badge'
import { Layers } from 'lucide-react'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'

interface DetailVariantsProps {
  variants: any[]
  formatCurrency: (n: number) => string
}

export function DetailVariants({ variants, formatCurrency }: DetailVariantsProps) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const t = useTranslations('products.products.detail.variants')

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-emerald-600" />
          {t('title', { count: variants.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant._id}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    {Object.entries(variant.attributes || {}).map(([key, value]) => (
                      <Badge key={key} variant="secondary">
                        {key}: {value as string}
                      </Badge>
                    ))}
                    <StatusBadge status={variant.status} />
                  </div>
                  {Array.isArray(variant.images) && variant.images.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      {variant.images.map((img: any, imgIdx: number) => (
                        <div
                          key={img.publicId || imgIdx}
                          className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100"
                        >
                          <Image
                            src={img.thumbnailUrl || img.url}
                            alt={`${Object.values(variant.attributes || {}).join(' ')} ${imgIdx + 1}`}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(variant.price)}</p>
                  {canViewCosts && (
                    <p className="text-sm text-muted-foreground">
                      {variant.costPrice > 0
                        ? t('cost', { amount: formatCurrency(variant.costPrice) })
                        : t('noCost')}
                    </p>
                  )}
                  {canViewCosts && variant.costPrice > 0 && (
                    <p className="text-xs font-medium text-blue-600">
                      {(((variant.price - variant.costPrice) / variant.price) * 100).toFixed(1)}{t('marginSuffix')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
