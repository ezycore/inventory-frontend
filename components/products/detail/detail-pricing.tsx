// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Separator } from '@ui/components/separator'
import { Tag } from 'lucide-react'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'

interface DetailPricingProps {
  product: any
  /** Selling price for the current scope (variant price when a variant tab is active). */
  sellingPrice: number
  /** Weighted-average cost from inventory (product.costPrice is not authoritative). */
  costPrice: number
  profitPerUnit: number
  salesTaxRate: number
  purchaseTaxRate: number
  /** Tax module gate (master `tax` + per-area sub-toggle) for each area. */
  salesTaxActive: boolean
  purchaseTaxActive: boolean
  formatCurrency: (n: number) => string
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value}
    </div>
  )
}

export function DetailPricing({
  product,
  sellingPrice,
  costPrice,
  profitPerUnit,
  salesTaxRate,
  purchaseTaxRate,
  salesTaxActive,
  purchaseTaxActive,
  formatCurrency,
}: DetailPricingProps) {
  // Cost and cost-derived figures (profit/unit) require the costs.view permission.
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const t = useTranslations('products.products.detail.pricing')

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-emerald-600" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {canViewCosts && (
            <Row
              label={t('costPrice')}
              value={<span className="text-sm font-medium">{formatCurrency(costPrice)}</span>}
            />
          )}
          <Row
            label={t('sellingPrice')}
            value={<span className="text-sm font-semibold text-emerald-600">{formatCurrency(sellingPrice)}</span>}
          />
          {product.mrp != null && product.mrp > 0 && (
            <Row label={t('mrp')} value={<span className="text-sm font-medium">{formatCurrency(product.mrp)}</span>} />
          )}
          {canViewCosts && (
            <Row
              label={t('profitPerUnit')}
              value={<span className="text-sm font-medium">{formatCurrency(profitPerUnit)}</span>}
            />
          )}
          {salesTaxActive && salesTaxRate > 0 && (
            <Row label={t('salesTax')} value={<span className="text-sm font-medium">{salesTaxRate}%</span>} />
          )}
          {purchaseTaxActive && purchaseTaxRate > 0 && (
            <Row label={t('purchaseTax')} value={<span className="text-sm font-medium">{purchaseTaxRate}%</span>} />
          )}
          {product.discountValue != null && product.discountValue > 0 && (
            <>
              <Separator />
              <Row
                label={t('discount')}
                value={
                  <span className="text-sm font-medium text-orange-600">
                    {product.discountType === 'fixed'
                      ? formatCurrency(product.discountValue)
                      : `${product.discountValue}%`}{' '}
                    {t('off')}
                  </span>
                }
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
