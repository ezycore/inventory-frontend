// coding-standard: maintained
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Separator } from '@ui/components/separator'
import { Tag } from 'lucide-react'

interface DetailPricingProps {
  product: any
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
  costPrice,
  profitPerUnit,
  salesTaxRate,
  purchaseTaxRate,
  salesTaxActive,
  purchaseTaxActive,
  formatCurrency,
}: DetailPricingProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-emerald-600" />
          Pricing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Row
            label="Cost Price"
            value={<span className="text-sm font-medium">{formatCurrency(costPrice)}</span>}
          />
          <Row
            label="Selling Price"
            value={<span className="text-sm font-semibold text-emerald-600">{formatCurrency(product.price)}</span>}
          />
          {product.mrp != null && product.mrp > 0 && (
            <Row label="MRP" value={<span className="text-sm font-medium">{formatCurrency(product.mrp)}</span>} />
          )}
          <Row
            label="Profit/Unit"
            value={<span className="text-sm font-medium">{formatCurrency(profitPerUnit)}</span>}
          />
          {salesTaxActive && salesTaxRate > 0 && (
            <Row label="Sales Tax" value={<span className="text-sm font-medium">{salesTaxRate}%</span>} />
          )}
          {purchaseTaxActive && purchaseTaxRate > 0 && (
            <Row label="Purchase Tax" value={<span className="text-sm font-medium">{purchaseTaxRate}%</span>} />
          )}
          {product.discountValue != null && product.discountValue > 0 && (
            <>
              <Separator />
              <Row
                label="Discount"
                value={
                  <span className="text-sm font-medium text-orange-600">
                    {product.discountType === 'fixed'
                      ? formatCurrency(product.discountValue)
                      : `${product.discountValue}%`}{' '}
                    off
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
