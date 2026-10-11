// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { MoneyCell } from "@/ui/components/dataTable/cells/money-cell";
import { Badge } from "@/ui/components/badge";

/** Which of the merchant's switches decide a column (business-modes R1: OFF means hidden). */
export interface CustomerColumnModes {
  /** `accounts` on — dues and store credit are tracked. Off, both read ৳0 on every row. */
  tracksMoney: boolean;
  /** `storefront` on — the online order columns. */
  online: boolean;
  /** `sales` (the counter) on — a default discount applies at the counter only. */
  counter: boolean;
}

const ALL_MODES: CustomerColumnModes = { tracksMoney: true, online: true, counter: true };

/**
 * `t` is bound to the `customers` namespace.
 *
 * Built for every business mode. Live, UriiBaba (online only, no ledger) saw Discount "None", Due
 * ৳0 and Credit Balance ৳0 on all 464 rows and nothing about orders — while the number a
 * cash-on-delivery seller checks before confirming is how often this buyer sent a parcel back.
 */
export function getCustomerColumns(
  t: Translator,
  modes: CustomerColumnModes = ALL_MODES,
): ColumnDef<Customer>[] {
  const columns: Array<ColumnDef<Customer> | false> = [
    {
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "phone",
      header: t("columns.phone"),
      cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span>,
    },
    modes.online && {
      id: "onlineOrders",
      header: t("columns.onlineOrders"),
      cell: ({ row }) => row.original.orderStats?.onlineOrders ?? 0,
    },
    modes.online && {
      id: "onlineSpent",
      header: t("columns.onlineSpent"),
      cell: ({ row }) => <MoneyCell value={row.original.orderStats?.onlineSpent ?? 0} />,
    },
    modes.online && {
      id: "returnedOrders",
      header: t("columns.returnedOrders"),
      cell: ({ row }) => {
        const count = row.original.orderStats?.returnedOrders ?? 0;
        return count > 0 ? (
          <span className="font-medium text-red-600">{count}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        );
      },
    },
    modes.online && {
      // The id IS the server's sort field (`sort_by=lastOrderAt`, backend `ORDER_STAT_SORTS`).
      id: "lastOrderAt",
      header: t("columns.lastOrder"),
      cell: ({ row }) =>
        row.original.orderStats?.lastOrderAt ? (
          <DateCell value={row.original.orderStats.lastOrderAt} />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    modes.counter && {
      accessorKey: "defaultDiscount",
      header: t("columns.discount"),
      cell: ({ row }) => {
        const discount = row.original.defaultDiscount;
        if (!discount) return <span className="text-muted-foreground">{t("columns.none")}</span>;

        const { value, type } = discount;
        const displayValue =
          type === "percentage" ? `${value}%` : `$${value.toFixed(2)}`;

        return <span className="font-medium">{displayValue}</span>;
      },
    },
    {
      accessorKey: "source",
      header: t("columns.source"),
      cell: ({ row }) => {
        const isStorefront = row.original.source === "storefront";
        return (
          <Badge variant={isStorefront ? "default" : "secondary"}>
            {isStorefront ? t("columns.sourceStorefront") : t("columns.sourceManual")}
          </Badge>
        );
      },
    },
    modes.tracksMoney && {
      accessorKey: "totalDue",
      header: t("columns.due"),
      cell: ({ row }) => (
        <MoneyCell value={row.original.totalDue ?? 0} accentClass="text-red-600" />
      ),
    },
    modes.tracksMoney && {
      accessorKey: "creditBalance",
      header: t("columns.creditBalance"),
      cell: ({ row }) => (
        <MoneyCell
          value={(row.original.creditBalance as number) ?? 0}
          accentClass="text-blue-600"
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("columns.createdDate"),
      cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
    },
    {
      accessorKey: "updatedAt",
      header: t("columns.updatedDate"),
      cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
    },
  ];
  return columns.filter((column): column is ColumnDef<Customer> => column !== false);
}
