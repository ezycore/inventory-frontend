// coding-standard: maintained
import { ColumnDef } from '@tanstack/react-table'
import { Package, Tag } from 'lucide-react'
import type { Category } from '@/types'
import { Badge } from '@/ui/components/badge'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import Link from 'next/link'

export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <AvatarCell
          name={row.getValue("name")}
          fallbackIcon={Tag}
          isActive={row.original.status === "active"}
        />
        {row.original.isDefault && (
          <Badge
            variant="outline"
            className="text-xs shrink-0 border-primary text-primary"
          >
            Default
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "productCount",
    header: "Products",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        {row.original.productCount > 0 ? (
          <Link href={`/products?categoryId=${row.original._id}`} className="hover:underline">
            {row.original.productCount || 0} Products
          </Link>
        ) : (
          <span>{row.original.productCount || 0} Products</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];
