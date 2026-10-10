// coding-standard: maintained
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Pencil, Tag } from 'lucide-react'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'
import { SetCostDialog } from './set-cost-dialog'

interface DetailPricingProps {
  product: any
  /** Selling price for the current scope (variant price when a variant tab is active). */
  sellingPrice: number
  /** Weighted-average cost from inventory (product.costPrice is not authoritative). `0` = none entered. */
  costPrice: number
  /** `null` when there is no cost — the selling price is not profit. */
  profitPerUnit: number | null
  /** The variant tab in view; the cost edit applies to it. */
  variantId?: string
  /**
   * May this business type a cost by hand (`canHandEditCost`)? When not, purchases maintain it and
   * the row says so instead of offering an edit.
   */
  costHandEditable: boolean
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
  variantId,
  costHandEditable,
  salesTaxRate,
  purchaseTaxRate,
  salesTaxActive,
  purchaseTaxActive,
  formatCurrency,
}: DetailPricingProps) {
  // Cost and cost-derived figures (profit/unit) require the costs.view permission.
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  // Editing cost needs the permission that shows it, plus product edit (§2.2 rule 2).
  const canEditProducts = useHasPermission(PERMISSIONS.productsEdit)
  const t = useTranslations('products.products.detail.pricing')
  const [editingCost, setEditingCost] = useState(false)
  // A combo's cost is its components' — it has no row of its own to set.
  const canEditCost =
    canViewCosts && canEditProducts && costHandEditable && product.productType !== 'combo'
  const hasCost = costPrice > 0

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
              value={
                <span className="flex items-center gap-1">
                  {hasCost ? (
                    <span className="text-sm font-medium">{formatCurrency(costPrice)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('noCost')}</span>
                  )}
                  {canEditCost && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setEditingCost(true)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      {hasCost ? t('editCost') : t('addCost')}
                    </Button>
                  )}
                </span>
              }
            />
          )}
          {canViewCosts && !costHandEditable && (
            <p className="-mt-2 text-xs text-muted-foreground">{t('costFromPurchases')}</p>
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
              value={
                profitPerUnit === null ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  <span className="text-sm font-medium">{formatCurrency(profitPerUnit)}</span>
                )
              }
            />
          )}
          {salesTaxActive && salesTaxRate > 0 && (
            <Row label={t('salesTax')} value={<span className="text-sm font-medium">{salesTaxRate}%</span>} />
          )}
          {purchaseTaxActive && purchaseTaxRate > 0 && (
            <Row label={t('purchaseTax')} value={<span className="text-sm font-medium">{purchaseTaxRate}%</span>} />
          )}
        </div>
      </CardContent>
      {editingCost && (
        <SetCostDialog
          open
          onOpenChange={setEditingCost}
          productId={product._id}
          variantId={variantId}
          sellingPrice={sellingPrice}
          currentCost={costPrice}
          formatCurrency={formatCurrency}
        />
      )}
    </Card>
  )
}
