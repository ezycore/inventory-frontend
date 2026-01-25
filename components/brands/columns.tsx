import { Brand } from "@/types";
import { DateCell } from "@/ui/components/dataTable/cells";
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { ColumnDef } from "@tanstack/react-table";

export const brandColumns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => {
      return (
        <AvatarCell
          imageUrl={row.original.images?.[0]?.thumbnailUrl}
          name={row.getValue("name")}
          isActive={row.original.status === "active"}
        />
      );
    },
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
