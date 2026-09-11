// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Separator } from '@ui/components/separator'
import { Info } from 'lucide-react'
import { CategoryPath } from '@/components/shared/category-path'
import { TagChips } from '@/components/shared/tag-chips'
import { richDocToPlainText } from '@/lib/storefront-rich-doc'
import type { InventoryItem } from './utils'

interface DetailInfoCardProps {
  product: any
  inventoryItems: InventoryItem[]
  expiryEnabled: boolean
  /** Off for a business that never counts stock — see `useStockTracked`. */
  stockTracked: boolean
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function DetailInfoCard({ product, inventoryItems, expiryEnabled, stockTracked }: DetailInfoCardProps) {
  const t = useTranslations('products.products.detail.info')
  const descriptionText = richDocToPlainText(product.description)
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
          <Row
            label={t('category')}
            value={<CategoryPath category={product.category?.name} subcategory={product.subcategory?.name} fallback="—" />}
          />
          <Row label={t('unit')} value={product.unit?.name || '—'} />
          {/* All of them here — the detail page has room, unlike a table row. */}
          <Row
            label={t('tags')}
            value={<TagChips tags={product.tags} max={Infinity} empty="—" />}
          />
          {expiryEnabled && (
            <Row label={t('expiryTracking')} value={product.hasExpiry ? t('enabled') : t('off')} />
          )}
          {expiryEnabled && product.hasExpiry && product.expiryAlertDays != null && (
            <Row label={t('expiryAlert')} value={t('daysBefore', { count: product.expiryAlertDays })} />
          )}
        </div>

        {/* The ghost inventory row a stock-free workspace carries is still a
            row, so length alone let "Low Stock Alert · ≤ 0 units" onto a page
            for a business with no such thing (QA-N14). */}
        {stockTracked && inventoryItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <Row label={t('lowStockAlert')} value={t('unitsThreshold', { count: inventoryItems[0]?.quantityAlert ?? 0 })} />
          </>
        )}

        {/* Flattened, not rendered rich. `RichDocView` CAN run in the admin —
            `field-view-mode.tsx` bridges --text/--muted/--faint onto the admin
            tokens — but this card is a read-only SUMMARY sitting in a row of
            one-line facts, and a body with headings and a size-chart table would
            dominate it. The merchant gets the formatted view in the editor.
            `whitespace-pre-line` keeps the paragraph breaks. */}
        {descriptionText && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">{t('description')}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{descriptionText}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
