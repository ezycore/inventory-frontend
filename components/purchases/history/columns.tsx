// coding-standard: maintained
import type { ColumnDef } from "@tanstack/react-table";
import type { Translator } from "@/i18n/config";
import { Eye, CreditCard, Copy, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import type { CustomAction } from "@/types/DataTable";
import type { PurchaseOrder } from "@/types";
import { populatedRef } from "@/utils/populated-ref";
import { copyText } from "@/utils/clipboard";
import { toast } from "sonner";
import { statusConfig } from "../status-config";

// ── Column factory ──────────────────────────────────────────────────

interface GetHistoryColumnsParams {
  formatCurrency: (n: number) => string;
  /** Bound to the `purchases` namespace. */
  t: Translator;
}

export const getPurchaseHistoryColumns = ({
  formatCurrency,
  t,
}: GetHistoryColumnsParams): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "orderNumber",
    header: t("history.colInvoiceNo"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">
          {row.original.orderNumber}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={async () => {
            try {
              await copyText(row.original.orderNumber);
              toast.success(t("history.invoiceCopied"));
            } catch {
              toast.error(t("history.copyFailed"));
            }
          }}
          title={t("history.copyInvoiceTooltip")}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: t("history.colPurchaseDate"),
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "supplierId",
    header: t("history.colSupplier"),
    cell: ({ row }) => {
      const name = populatedRef(row.original.supplierId)?.name;
      return (
        <span className="font-medium">
          {name || <span className="text-muted-foreground">{t("history.walkIn")}</span>}
        </span>
      );
    },
  },
  {
    accessorKey: "invoiceAmount",
    header: () => <span className="flex justify-end">{t("history.colTotal")}</span>,
    cell: ({ row }) => (
      <span className="flex justify-end font-medium">
        {formatCurrency(row.original.invoiceAmount || 0)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: () => <span className="flex justify-end">{t("history.colPaid")}</span>,
    cell: ({ row }) => (
      <span className="flex justify-end text-green-600">
        {formatCurrency(row.original.paidAmount || 0)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: () => <span className="flex justify-end">{t("history.colDue")}</span>,
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
    header: t("history.colStatus"),
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status];
      return (
        <Badge variant={config.variant} className="w-fit">
          {t(`status.${status}`)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: t("history.colCreatedBy"),
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
  /** Bound to the `purchases` namespace. */
  t: Translator;
}

export const getPurchaseHistoryActions = ({
  onViewSummary,
  onMakePayment,
  isAccountsEnabled,
  onEditDraft,
  onDeleteDraft,
  t,
}: GetHistoryActionsParams): CustomAction[] => [
  {
    type: "custom",
    placement: "cell",
    icon: <Eye className="h-4 w-4" />,
    label: t("history.actionSummary"),
    tooltip: t("history.actionSummaryTooltip"),
    onClick: (row) => onViewSummary(row as PurchaseOrder),
  },
  ...(isAccountsEnabled
    ? [
        {
          type: "custom" as const,
          placement: "cell" as const,
          icon: <CreditCard className="h-4 w-4" />,
          label: t("history.actionPayment"),
          tooltip: t("history.actionPaymentTooltip"),
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
          label: t("history.actionEditDraft"),
          tooltip: t("history.actionEditDraftTooltip"),
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
          label: t("history.actionDeleteDraft"),
          tooltip: t("history.actionDeleteDraftTooltip"),
          onClick: (row: unknown) => onDeleteDraft(row as PurchaseOrder),
          hidden: (row: unknown) => (row as PurchaseOrder).status !== "draft",
        },
      ]
    : []),
];
