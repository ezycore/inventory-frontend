import type { ComponentProps } from "react";
import Link from "next/link";
import type { AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { DateCell } from "@/ui/components/dataTable/cells";
import { StatusBadge } from "@/ui/components/status-badge";
import type { ColumnDef } from "@tanstack/react-table";

export const orderColumns: ColumnDef<AdminStorefrontOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        href={`/ecommerce/orders/${row.original._id}`}
        className="font-medium hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "shippingAddress",
    header: "Customer",
    cell: ({ row }) => <span>{row.original.shippingAddress?.name}</span>,
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const currency = useAuthStore.getState().user?.organization?.currency;
      return (
        <span className="font-medium tabular-nums">
          {formatMoney(row.original.totalAmount, currency)}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.paymentMethod} · {row.original.paymentStatus}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={
          row.original.status as ComponentProps<typeof StatusBadge>["status"]
        }
      />
    ),
  },
];
