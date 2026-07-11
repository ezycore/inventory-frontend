// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Separator } from '@ui/components/separator'
import { Info } from 'lucide-react'
import type { InventoryItem } from './utils'

interface DetailInfoCardProps {
  product: any
  inventoryItems: InventoryItem[]
  expiryEnabled: boolean
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function DetailInfoCard({ product, inventoryItems, expiryEnabled }: DetailInfoCardProps) {
  const t = useTranslations('products.products.detail.info')
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-emerald-600" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="space-y-3">
          <Row label={t('productType')} value={<span className="capitalize">{product.productType}</span>} />
          <Row label={t('brand')} value={product.brand?.name || '—'} />
          <Row label={t('category')} value={product.category?.name || '—'} />
          <Row label={t('unit')} value={product.unit?.name || '—'} />
          {expiryEnabled && (
            <Row label={t('expiryTracking')} value={product.hasExpiry ? t('enabled') : t('off')} />
          )}
          {expiryEnabled && product.hasExpiry && product.expiryAlertDays != null && (
            <Row label={t('expiryAlert')} value={t('daysBefore', { count: product.expiryAlertDays })} />
          )}
        </div>

        {inventoryItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <Row label={t('lowStockAlert')} value={t('unitsThreshold', { count: inventoryItems[0]?.quantityAlert ?? 0 })} />
          </>
        )}

        {product.description && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">{t('description')}</p>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
