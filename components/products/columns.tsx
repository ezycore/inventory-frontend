import { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import { ProductStatus } from '@/types'
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
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    header: 'Brand',
    accessorKey: 'brand',
    cell: ({ row }) => {
      const brand = row.getValue("brand") as any
      return brand?.name || '-'
    },
  },
  {
    header: 'Category',
    accessorKey: 'category',
    cell: ({ row }) => {
      const category = row.getValue("category") as any
      return category?.name || '-'
    },
  },
  {
    header: 'Price',
    accessorKey: 'price',
    cell: ({ row }) => {
      const price = row.getValue("price")
      return price ? `$${Number(price).toFixed(2)}` : '-'
    }
  },
];
