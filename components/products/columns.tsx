// coding-standard: maintained
import { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import { ProductStatus } from '@/types'
import { Badge } from '@/ui/components/badge'
import Link from 'next/link'
import type { Translator } from '@/i18n/config'

/**
 * Price cell text. Single/combo products carry a top-level `price`; variable
 * products don't — their price lives per-variant, so show the floor–ceiling
 * range (e.g. `7 – 10`, or just `7` when every variant is priced the same).
 */
const formatPriceDisplay = (product: any): string | null => {
  const price = product.price as number | undefined
  if (typeof price === 'number' && price > 0) return Number(price).toLocaleString()

  const variantPrices = (product.variants as { price?: number }[] | undefined)
    ?.map((v) => v.price)
    .filter((p): p is number => typeof p === 'number' && p > 0)
  if (!variantPrices?.length) return null

  const min = Math.min(...variantPrices)
  const max = Math.max(...variantPrices)
  return min === max
    ? Number(min).toLocaleString()
    : `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()}`
}

export const getProductColumns = (t: Translator): ColumnDef<any>[] => [
  {
    header: t('columns.name'),
    accessorKey: 'name',
    cell: ({ row }) => (
      <Link href={`/products/${row.original.slug}`} className="block hover:underline">
        <AvatarCell
          imageUrl={row.original.images?.[0]?.thumbnailUrl || row.original.variants?.[0]?.images?.[0]?.thumbnailUrl}
          name={row.getValue("name")}
          fallbackIcon={Package}
          isActive={row.original.status === ProductStatus.ACTIVE}
        />
      </Link>
    ),
  },
  {
    header: t('columns.barcode'),
    accessorKey: 'barcode',
    cell: ({ row }) => {
      const code = row.original.barcode as string | undefined
      const productType = row.original.productType as string
      if (!code) {
        return (
          <span className="text-xs text-muted-foreground">
            {productType === 'variable' ? t('columns.barcodePerVariant') : '—'}
          </span>
        )
      }
      return (
        <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
          {code}
        </code>
      )
    },
  },
  {
    header: t('columns.category'),
    accessorKey: 'category',
    cell: ({ row }) => {
      const category = row.getValue("category") as any
      return (
        <span className="text-muted-foreground text-sm">
          {category?.name || t('columns.uncategorized')}
        </span>
      )
    },
  },
  {
    header: t('columns.brand'),
    accessorKey: 'brand',
    cell: ({ row }) => {
      const brand = row.getValue("brand") as any
      return (
        <span className="text-sm font-medium">
          {brand?.name || '-'}
        </span>
      )
    },
  },
  {
    header: t('columns.type'),
    accessorKey: 'productType',
    cell: ({ row }) => {
      const type = row.getValue("productType") as string
      const storefront = row.original.storefront as
        | { isListed?: boolean; featured?: boolean }
        | undefined
      return (
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={type === 'variable' ? 'secondary' : 'outline'} className="capitalize">
            {type}
          </Badge>
          {/* Storefront state — only rendered for exceptions, so non-ecommerce orgs see nothing */}
          {storefront?.featured ? (
            <Badge variant="secondary" className="text-[10px]">Featured</Badge>
          ) : null}
          {storefront?.isListed === false ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">Hidden</Badge>
          ) : null}
        </div>
      )
    },
  },
  {
    header: t('columns.price'),
    accessorKey: 'price',
    cell: ({ row }) => {
      const priceLabel = formatPriceDisplay(row.original)
      const unit = row.original.unit as { name?: string; shortName?: string } | undefined
      const unitLabel = unit?.shortName || unit?.name
      return (
        <span className="text-sm font-semibold tabular-nums">
          {priceLabel ?? '-'}
          {priceLabel && unitLabel ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              / {unitLabel}
            </span>
          ) : null}
        </span>
      )
    }
  },
  {
    header: t('columns.status'),
    accessorKey: 'status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
];
