import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'
import type { Category } from '@/types'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'

export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => (
      <AvatarCell
        name={row.getValue("name")}
        fallbackIcon={Tag}
        isActive={row.original.status === "active"}
      />
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
