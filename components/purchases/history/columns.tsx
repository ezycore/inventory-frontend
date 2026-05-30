import type { ColumnDef } from "@tanstack/react-table";
import { Eye, CreditCard, Copy, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import type { CustomAction } from "@/types/DataTable";
import type { PurchaseOrder } from "@/types";
import { toast } from "sonner";
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
    header: "Invoice #",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">
          {row.original.orderNumber}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            navigator.clipboard.writeText(row.original.orderNumber);
            toast.success("Invoice number copied");
          }}
          title="Copy invoice number"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Purchase Date",
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "supplierId",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier =
        (row.original as PurchaseOrder).supplierId ||
        (row.original as PurchaseOrder).supplier;
      const name =
        typeof supplier === "object" && supplier
          ? (supplier as { name?: string }).name
          : undefined;
      return (
        <span className="font-medium">
          {name || <span className="text-muted-foreground">Walk-in</span>}
        </span>
      );
    },
  },
  {
    accessorKey: "invoiceAmount",
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
        <Badge variant={config.variant} className="w-fit">
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const cb = row.original.createdBy;
      if (cb && typeof cb === "object") {
        const fn = (cb as { firstName?: string }).firstName;
        const ln = (cb as { lastName?: string }).lastName;
        const name = [fn, ln].filter(Boolean).join(" ").trim();
        return name ? (
          <span>{name}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      }
      return <span className="text-muted-foreground">-</span>;
    },
  },
];

// ── Actions factory ─────────────────────────────────────────────────

interface GetHistoryActionsParams {
  onViewSummary: (order: PurchaseOrder) => void;
  onMakePayment: (order: PurchaseOrder) => void;
  isAccountsEnabled: boolean;
  onEditDraft?: (order: PurchaseOrder) => void;
  onDeleteDraft?: (order: PurchaseOrder) => void;
}

export const getPurchaseHistoryActions = ({
  onViewSummary,
  onMakePayment,
  isAccountsEnabled,
  onEditDraft,
  onDeleteDraft,
}: GetHistoryActionsParams): CustomAction[] => [
  {
    type: "custom",
    placement: "cell",
    icon: <Eye className="h-4 w-4" />,
    label: "Summary",
    tooltip: "View purchase summary and items",
    onClick: (row) => onViewSummary(row as PurchaseOrder),
  },
  ...(isAccountsEnabled
    ? [
        {
          type: "custom" as const,
          placement: "cell" as const,
          icon: <CreditCard className="h-4 w-4" />,
          label: "Payment",
          tooltip: "Record payment",
          onClick: (row: unknown) => onMakePayment(row as PurchaseOrder),
          disabled: (row: unknown) => {
            const order = row as PurchaseOrder;
            return (
              order.status === "draft" ||
              (order.dueAmount || 0) <= 0 ||
              order.status === "cancelled"
            );
          },
        },
      ]
    : []),
  ...(onEditDraft
    ? [
        {
          type: "custom" as const,
          placement: "cell" as const,
          icon: <Pencil className="h-4 w-4" />,
          label: "Edit draft",
          tooltip: "Resume editing this draft",
          onClick: (row: unknown) => onEditDraft(row as PurchaseOrder),
          hidden: (row: unknown) => (row as PurchaseOrder).status !== "draft",
        },
      ]
    : []),
  ...(onDeleteDraft
    ? [
        {
          type: "custom" as const,
          placement: "cell" as const,
          icon: <Trash2 className="h-4 w-4" />,
          label: "Delete draft",
          tooltip: "Permanently delete this draft",
          onClick: (row: unknown) => onDeleteDraft(row as PurchaseOrder),
          hidden: (row: unknown) => (row as PurchaseOrder).status !== "draft",
        },
      ]
    : []),
];
