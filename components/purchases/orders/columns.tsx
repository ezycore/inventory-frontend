// coding-standard: maintained
import type { PurchaseOrder } from "@/types";
import type { Translator } from "@/i18n/config";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import type { ColumnDef } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import { statusConfig } from "../status-config";

interface GetCreatedOrdersColumnsParams {
  formatCurrency: (amount: number) => string;
  /** Bound to the `purchases` namespace. */
  t: Translator;
}

export const getCreatedOrdersColumns = ({
  formatCurrency,
  t,
}: GetCreatedOrdersColumnsParams): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "orderNumber",
    header: t("orders.colOrderNo"),
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.original.orderNumber}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: t("orders.colDate"),
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "supplierId",
    header: t("orders.colSupplier"),
    cell: ({ row }) => {
      const supplier = row.original.supplierId;
      return (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {supplier?.name || (
              <span className="text-muted-foreground">{t("orders.unknown")}</span>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    header: t("orders.colItems"),
    cell: ({ row }) => (
      <Badge variant="outline">{t("orders.itemsCount", { count: row.original.items.length })}</Badge>
    ),
  },
  {
    accessorKey: "invoiceAmount",
    header: () => <span className="flex justify-end">{t("orders.colTotalAmount")}</span>,
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
    header: t("orders.colStatus"),
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status];
      return (
        <Badge variant={config.variant} className="flex gap-1 w-fit">
          {config.icon}
          {t(`status.${status}`)}
        </Badge>
      );
    },
  },
];
