import { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import { ProductStatus } from '@/types'
import { Badge } from '@/ui/components/badge'
import Link from 'next/link'

export const productColumns: ColumnDef<any>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => (
      <Link href={`/products/${row.original._id}`} className="block hover:underline">
        <AvatarCell
          imageUrl={row.original.images?.[0]?.thumbnailUrl}
          name={row.getValue("name")}
          fallbackIcon={Package}
          isActive={row.original.status === ProductStatus.ACTIVE}
        />
      </Link>
    ),
  },
  {
    header: 'Barcode',
    accessorKey: 'barcode',
    cell: ({ row }) => {
      const code = row.original.barcode as string | undefined
      const productType = row.original.productType as string
      if (!code) {
        return (
          <span className="text-xs text-muted-foreground">
            {productType === 'variable' ? 'per-variant' : '—'}
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
    header: 'Category',
    accessorKey: 'category',
    cell: ({ row }) => {
      const category = row.getValue("category") as any
      return (
        <span className="text-muted-foreground text-sm">
          {category?.name || 'Uncategorized'}
        </span>
      )
    },
  },
  {
    header: 'Brand',
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
    header: 'Type',
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
    header: 'Price',
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
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
];
