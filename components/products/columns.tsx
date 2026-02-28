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
      return (
        <Badge variant={type === 'variable' ? 'secondary' : 'outline'} className="capitalize">
          {type}
        </Badge>
      )
    },
  },
  {
    header: 'Price',
    accessorKey: 'price',
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      return (
        <span className="text-sm font-semibold tabular-nums">
          {price ? `৳${Number(price).toLocaleString()}` : '-'}
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
