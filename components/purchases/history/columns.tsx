import type { PurchaseOrder } from "@/types";
import type { CustomAction } from "@/types/DataTable";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Package, Receipt } from "lucide-react";
import { statusConfig } from "../status-config";

// ── Column factory ──────────────────────────────────────────────────

interface GetHistoryColumnsParams {
  formatCurrency: (n: number) => string;
}

export const getPurchaseHistoryColumns = ({
  formatCurrency,
}: GetHistoryColumnsParams): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.original.orderNumber}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.original.supplier;
      return (
        <span className="font-medium">
          {supplier?.name || (
            <span className="text-muted-foreground">Unknown</span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.items.length}</Badge>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: () => <span className="flex justify-end">Total</span>,
    cell: ({ row }) => (
      <span className="flex justify-end font-medium">
        {formatCurrency(row.original.invoiceAmount || 0)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: () => <span className="flex justify-end">Paid</span>,
    cell: ({ row }) => (
      <span className="flex justify-end text-green-600">
        {formatCurrency(row.original.paidAmount || 0)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: () => <span className="flex justify-end">Due</span>,
    cell: ({ row }) => (
      <span
        className={`flex justify-end ${
          (row.original.dueAmount || 0) > 0
            ? "text-red-600 font-medium"
            : "text-muted-foreground"
        }`}
      >
        {formatCurrency(row.original.dueAmount || 0)}
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

// ── Actions factory ─────────────────────────────────────────────────

interface GetHistoryActionsParams {
  onViewDetails: (order: PurchaseOrder) => void;
  onViewPayments: (order: PurchaseOrder) => void;
  onMakePayment: (order: PurchaseOrder) => void;
  isAccountsEnabled: boolean;
}

export const getPurchaseHistoryActions = ({
  onViewDetails,
  onViewPayments,
  onMakePayment,
  isAccountsEnabled,
}: GetHistoryActionsParams): CustomAction[] => [
  {
    type: "custom",
    placement: "cell",
    icon: <Package className="h-4 w-4" />,
    label: "View Details",
    tooltip: "View order details",
    onClick: (row) => onViewDetails(row as PurchaseOrder),
  },
  {
    type: "custom",
    placement: "cell",
    icon: <Receipt className="h-4 w-4" />,
    label: "View Payments",
    tooltip: "View payment history",
    onClick: (row) => onViewPayments(row as PurchaseOrder),
  },
  ...(isAccountsEnabled
    ? [
        {
          type: "custom" as const,
          placement: "cell" as const,
          icon: <CreditCard className="h-4 w-4" />,
          label: "Make Payment",
          tooltip: "Add payment for this purchase",
          onClick: (row: unknown) =>
            onMakePayment(row as PurchaseOrder),
          disabled: (row: unknown) => {
            const order = row as PurchaseOrder;
            return (order.dueAmount || 0) <= 0 || order.status === "cancelled";
          },
        },
      ]
    : []),
];
