// coding-standard: maintained
'use client'

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
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-emerald-600" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="space-y-3">
          <Row label="Product Type" value={<span className="capitalize">{product.productType}</span>} />
          <Row label="Brand" value={product.brand?.name || '—'} />
          <Row label="Category" value={product.category?.name || '—'} />
          <Row label="Unit" value={product.unit?.name || '—'} />
          {expiryEnabled && (
            <Row label="Expiry Tracking" value={product.hasExpiry ? 'Enabled' : 'Off'} />
          )}
          {expiryEnabled && product.hasExpiry && product.expiryAlertDays != null && (
            <Row label="Expiry Alert" value={`${product.expiryAlertDays} days before`} />
          )}
        </div>

        {inventoryItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <Row label="Low Stock Alert" value={`≤ ${inventoryItems[0]?.quantityAlert ?? 0} units`} />
          </>
        )}

        {product.description && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Description</p>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
