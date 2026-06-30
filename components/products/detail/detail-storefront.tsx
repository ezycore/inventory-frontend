// coding-standard: maintained
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Separator } from '@ui/components/separator'
import { Globe } from 'lucide-react'

interface DetailStorefrontProps {
  storefront: {
    isListed: boolean
    onlinePrice?: number
    featured?: boolean
    onlineDescription?: string
  }
  formatCurrency: (n: number) => string
}

export function DetailStorefront({ storefront, formatCurrency }: DetailStorefrontProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-emerald-600" />
          Online Storefront
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Listed</span>
            <Badge variant={storefront.isListed ? 'default' : 'secondary'}>
              {storefront.isListed ? 'Yes' : 'No'}
            </Badge>
          </div>
          {storefront.featured && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Featured</span>
              <Badge className="bg-amber-100 text-amber-700">Featured</Badge>
            </div>
          )}
          {storefront.onlinePrice != null && storefront.onlinePrice > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Online Price</span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(storefront.onlinePrice)}
              </span>
            </div>
          )}
          {storefront.onlineDescription && (
            <>
              <Separator className="my-2" />
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Online Description</p>
                <p className="text-sm leading-relaxed">{storefront.onlineDescription}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
