// coding-standard: maintained
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { HandCoins } from "lucide-react";
import type { Customer } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { MoneyCell } from "@/ui/components/dataTable/cells/money-cell";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { DiscountCell } from "@/components/ecommerce/discount-cell";

/** Which of the merchant's switches decide a column (business-modes R1: OFF means hidden). */
export interface CustomerColumnModes {
  /** `accounts` on — dues and store credit are tracked. Off, both read ৳0 on every row. */
  tracksMoney: boolean;
  /** `storefront` on — the online order columns. */
  online: boolean;
  /** `sales` (the counter) on — a default discount applies at the counter only. */
  counter: boolean;
  /** The phone opens this buyer's online orders — storefront on and `storefront.orders.view` held. */
  phoneOpensOrders?: boolean;
  /**
   * Take a payment from a customer who owes — renders a Receive button beside the Due amount.
   * Omit it when the user cannot (no `accounts`, or no `sales.edit`) and the amount stands alone.
   */
  onReceivePayment?: (customer: Customer) => void;
}

const ALL_MODES: CustomerColumnModes = {
  tracksMoney: true,
  online: true,
  counter: true,
  phoneOpensOrders: true,
};

/** The Online Orders list searched by this phone — the server matches the shipping phone. */
export const ordersByPhoneHref = (phone: string) =>
  `/ecommerce/orders?q=${encodeURIComponent(phone)}`;

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
      cell: ({ row }) => {
        const phone = row.original.phone;
        if (!phone) return <span className="text-muted-foreground">—</span>;
        return modes.online && modes.phoneOpensOrders ? (
          <Link
            href={ordersByPhoneHref(phone)}
            className="text-primary hover:underline"
            title={t("columns.phoneOpensOrders")}
          >
            {phone}
          </Link>
        ) : (
          phone
        );
      },
    },
    modes.online && {
      // The ids ARE the server's sort fields (`sort_by=…`, backend `ORDER_STAT_SORTS`), and the
      // accessor is what lets the header sort at all — TanStack never sorts an id-only column.
      id: "onlineOrders",
      accessorFn: (customer) => customer.orderStats?.onlineOrders ?? 0,
      header: t("columns.onlineOrders"),
      cell: ({ row }) => row.original.orderStats?.onlineOrders ?? 0,
    },
    modes.online && {
      id: "onlineSpent",
      accessorFn: (customer) => customer.orderStats?.onlineSpent ?? 0,
      header: t("columns.onlineSpent"),
      cell: ({ row }) => <MoneyCell value={row.original.orderStats?.onlineSpent ?? 0} />,
    },
    modes.online && {
      id: "returnedOrders",
      accessorFn: (customer) => customer.orderStats?.returnedOrders ?? 0,
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
      id: "lastOrderAt",
      accessorFn: (customer) => customer.orderStats?.lastOrderAt ?? null,
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

        // The shop's currency, not a hard-coded "$".
        return (
          <span className="font-medium">
            <DiscountCell type={discount.type} value={discount.value} />
          </span>
        );
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
      // The payment action sits beside the amount it settles, not in the actions column: only
      // some rows owe, and a button there on those rows alone knocked every row's icons out of line.
      cell: ({ row }) => {
        const due = row.original.totalDue ?? 0;
        const amount = <MoneyCell value={due} accentClass="text-red-600" />;
        if (!(due > 0) || !modes.onReceivePayment) return amount;
        return (
          <div className="flex items-center gap-2">
            {amount}
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => modes.onReceivePayment?.(row.original)}
            >
              <HandCoins className="h-3.5 w-3.5" />
              {t("columns.receive")}
            </Button>
          </div>
        );
      },
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
  ];
  return columns.filter((column): column is ColumnDef<Customer> => column !== false);
}
