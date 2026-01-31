'use client'

import { Badge } from '@ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Separator } from '@ui/components/separator'
import { Skeleton } from '@ui/components/skeleton'
import { Button } from '@ui/components/button'
import { Package, Tag, Building2, DollarSign, TrendingDown, Layers, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/ui/components/status-badge'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { useProduct } from '@/services/api/queries'

type Status = 
  | "active" | "inactive" | "expired" | "pending" | "completed" 
  | "approved" | "rejected" | "processing" | "failed" | "cancelled"
  | "draft" | "published" | "disabled" | "enabled" | "paused"
  | "warning" | "error" | "success" | "info" | "new" | "scheduled"
  | "online" | "offline" | "verified" | "blocked" | "deleted"
  | "suspended" | "review" | "moderate" | "confirmed" | "premium"
  | "featured" | "vip" | "in_progress" | "in-progress"

interface ProductVariant {
  _id: string
  attributes: Record<string, string>
  price: number
  costPrice: number
  status: Status
  sku?: string
  images?: any
}

interface Product {
  _id: string
  name: string
  description?: string
  images?: Array<{ url: string }> | null
  status: Status
  productType: string
  sellingType: string
  discountType?: string
  discountValue?: number
  hasExpiry: boolean
  price: number
  costPrice: number
  slug: string
  createdAt: string
  updatedAt: string
  category?: { _id: string; name: string }
  brand?: { _id: string; name: string }
  variants?: ProductVariant[]
  variant_count?: number
}

interface ProductDetailProps {
  productId: string
  onClose?: () => void
}

export function ProductDetail({ productId, onClose }: ProductDetailProps) {
  const { data, isLoading, error } = useProduct(productId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        {onClose && <Button onClick={onClose}>Close</Button>}
      </div>
    )
  }

  const product = data.data
  const hasVariants = product.productType === 'variable' && product.variants && product.variants.length > 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getMargin = (price: number, cost: number) => {
    if (cost === 0) return 0
    return (((price - cost) / price) * 100).toFixed(1)
  }

  const imageUrl = product.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0].url 
    : null

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {imageUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground mt-1">{product.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={product.status} />
              <Badge variant="outline">{product.productType}</Badge>
              <Badge variant="outline">{product.sellingType}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold">{product.category?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-semibold">{product.brand?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SKU/Slug */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <p className="font-semibold font-mono text-sm">{product.slug}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Section */}
      {!hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selling Price</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(product.price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cost Price</p>
                <p className="text-2xl font-bold">{formatPrice(product.costPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getMargin(product.price, product.costPrice)}%
                </p>
              </div>
            </div>

            {product.discountValue && product.discountValue > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Discount Applied</p>
                  <p className="text-sm text-muted-foreground">
                    {product.discountType === 'fixed' 
                      ? formatPrice(product.discountValue)
                      : `${product.discountValue}%`} off
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Variants Section */}
      {hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Product Variants ({product.variant_count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.variants?.map((variant) => (
                <div
                  key={variant._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <Badge key={key} variant="secondary">
                            {key}: {value as string}
                          </Badge>
                        ))}
                        <StatusBadge status={variant.status} />
                      </div>
                      {variant.sku && (
                        <p className="text-sm text-muted-foreground font-mono">
                          SKU: {variant.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(variant.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cost: {formatPrice(variant.costPrice)}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {getMargin(variant.price, variant.costPrice)}% margin
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Has Expiry</p>
              <p className="font-medium">{product.hasExpiry ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product Type</p>
              <p className="font-medium capitalize">{product.productType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selling Type</p>
              <p className="font-medium capitalize">{product.sellingType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
