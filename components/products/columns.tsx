// coding-standard: maintained
import { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import { ProductStatus } from '@/types'
import { Badge } from '@/ui/components/badge'
import Link from 'next/link'
import type { Translator } from '@/i18n/config'

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
      return (
        <Badge variant={type === 'variable' ? 'secondary' : 'outline'} className="capitalize">
          {type}
        </Badge>
      )
    },
  },
  {
    header: t('columns.price'),
    accessorKey: 'price',
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      const unit = row.original.unit as { name?: string; shortName?: string } | undefined
      const unitLabel = unit?.shortName || unit?.name
      return (
        <span className="text-sm font-semibold tabular-nums">
          {price ? Number(price).toLocaleString() : '-'}
          {price && unitLabel ? (
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
