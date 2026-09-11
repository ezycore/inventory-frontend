// coding-standard: maintained
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { Card } from '@ui/components/card'
import { StatusBadge } from '@/ui/components/status-badge'
import { CategoryPath } from '@/components/shared/category-path'
import { richDocToPlainText } from '@/lib/storefront-rich-doc'

interface ProductImage {
  url?: string
  thumbnailUrl?: string
  publicId?: string
}

interface DetailHeroProps {
  product: any
  /** Active variant (variable products) — its image/price take priority. */
  variant?: any
  /** Selling price for the active scope (variant price, else product price). */
  sellingPrice: number
  barcode: string
  formatCurrency: (n: number) => string
}

/**
 * Display images for the active scope: the selected variant's images when it has
 * any, else the product's own images (root image), else empty.
 */
function collectImages(product: any, variant: any): ProductImage[] {
  const variantImgs = Array.isArray(variant?.images) ? variant.images : []
  if (variantImgs.length > 0) return variantImgs
  return Array.isArray(product?.images) ? product.images : []
}

export function DetailHero({ product, variant, sellingPrice, barcode, formatCurrency }: DetailHeroProps) {
  const t = useTranslations('products.products.detail')
  const images = collectImages(product, variant)
  const [active, setActive] = useState(0)
  const primary = images[active] || images[0]
  const descriptionText = richDocToPlainText(product.description)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6 p-6 sm:flex-row">
        {/* Image gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative h-44 w-44 flex-shrink-0 overflow-hidden rounded-xl border bg-muted">
            {primary ? (
              <Image
                src={primary.url || primary.thumbnailUrl || ''}
                alt={product.name}
                fill
                className="object-cover"
                sizes="176px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={img.publicId || idx}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`relative h-12 w-12 overflow-hidden rounded-md border transition-all ${
                    idx === active ? 'ring-2 ring-emerald-500' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.thumbnailUrl || img.url || ''}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + key facts */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <StatusBadge status={product.status} />
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {product.productType}
            </span>
          </div>

          {/* Flattened: a two-line clamp of raw rich-doc JSON would read
              `{"type":"doc","content":[{"ty…`. Legacy plain text passes through
              `richDocToPlainText` unchanged. */}
          {descriptionText && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {descriptionText}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {barcode && (
              <span className="text-muted-foreground">
                {t('barcode')} <span className="font-mono font-medium text-foreground">{barcode}</span>
              </span>
            )}
            {product.category?.name && (
              <span className="text-muted-foreground">
                {t('category')}{' '}
                <CategoryPath
                  category={product.category.name}
                  subcategory={product.subcategory?.name}
                  className="font-medium text-foreground"
                />
              </span>
            )}
          </div>

          <div className="mt-auto pt-4">
            <span className="text-xs text-muted-foreground">{t('sellingPrice')}</span>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(sellingPrice)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
