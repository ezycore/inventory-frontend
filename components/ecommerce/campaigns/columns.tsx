// coding-standard: maintained
import type { Campaign } from "@/services/api";
import { DiscountCell } from "@/components/ecommerce/discount-cell";
import { DateCell } from "@/ui/components/dataTable/cells";
import { StatusBadge } from "@/ui/components/status-badge";
import type { ColumnDef } from "@tanstack/react-table";

export const campaignColumns: ColumnDef<Campaign>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "scope",
    header: "Scope",
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.scope}
      </span>
    ),
  },
  {
    accessorKey: "value",
    header: "Discount",
    cell: ({ row }) => (
      <DiscountCell type={row.original.type} value={row.original.value} />
    ),
  },
  {
    accessorKey: "startsAt",
    header: "Window",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
          <DateCell value={c.startsAt} className="text-xs" />
          <span>→</span>
          <DateCell value={c.endsAt} className="text-xs" />
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
