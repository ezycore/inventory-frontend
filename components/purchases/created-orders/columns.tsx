import type { PurchaseOrder } from "@/types";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import type { ColumnDef } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import { statusConfig } from "../status-config";

interface GetCreatedOrdersColumnsParams {
  formatCurrency: (amount: number) => string;
}

export const getCreatedOrdersColumns = ({
  formatCurrency,
}: GetCreatedOrdersColumnsParams): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.original.orderNumber}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "supplierId",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.original.supplierId;
      return (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {supplier?.name || (
              <span className="text-muted-foreground">Unknown</span>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.items.length} items</Badge>
    ),
  },
  {
    accessorKey: "invoiceAmount",
    header: () => <span className="flex justify-end">Total Amount</span>,
    cell: ({ row }) => (
      <span className="flex justify-end font-medium">
        {formatCurrency(
          row.original.invoiceAmount ||
            row.original.grandTotal ||
            row.original.totalAmount ||
            row.original.subtotal ||
            0,
        )}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status];
      return (
        <Badge variant={config.variant} className="flex gap-1 w-fit">
          {config.icon}
          {config.label}
        </Badge>
      );
    },
  },
];
