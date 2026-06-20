import type { Coupon } from "@/services/api";
import { DateCell } from "@/ui/components/dataTable/cells";
import { StatusBadge } from "@/ui/components/status-badge";
import type { ColumnDef } from "@tanstack/react-table";

export const couponColumns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono font-medium uppercase">
        {row.original.code}
      </span>
    ),
  },
  {
    accessorKey: "value",
    header: "Discount",
    cell: ({ row }) => {
      const c = row.original;
      return <span>{c.type === "percentage" ? `${c.value}%` : c.value}</span>;
    },
  },
  {
    accessorKey: "usedCount",
    header: "Used",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <span className="text-muted-foreground">
          {c.usedCount}
          {c.maxUses ? ` / ${c.maxUses}` : ""}
        </span>
      );
    },
  },
  {
    accessorKey: "validUntil",
    header: "Valid Until",
    cell: ({ row }) =>
      row.original.validUntil ? (
        <DateCell value={row.original.validUntil} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
