// coding-standard: maintained
import { HandCoins } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { Supplier } from "@/types";
import type { Translator } from "@/i18n/config";
import { Button } from "@/ui/components/button";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { MoneyCell } from "@/ui/components/dataTable/cells/money-cell";
import { DiscountCell } from "@/components/ecommerce/discount-cell";

/** Which of the merchant's switches decide a column (business-modes R1: OFF means hidden). */
export interface SupplierColumnModes {
  /** `accounts` on — what the shop owes each supplier is tracked. Off, Due would read ৳0 on every row. */
  tracksMoney: boolean;
  /**
   * Pay a supplier the shop owes — renders a Pay button beside the Due amount. Omit it when
   * the user cannot (no `purchases.edit`) and the amount stands alone.
   */
  onPay?: (supplier: Supplier) => void;
}

/** `t` is bound to the `suppliers` namespace. */
export function getSupplierColumns(
  t: Translator,
  modes: SupplierColumnModes = { tracksMoney: true },
): ColumnDef<Supplier>[] {
  const columns: Array<ColumnDef<Supplier> | false> = [
    {
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "defaultDiscount",
      header: t("columns.discount"),
      cell: ({ row }) => {
        const discount = row.original.defaultDiscount;
        if (!discount)
          return (
            <span className="text-muted-foreground">{t("columns.none")}</span>
          );

        // The shop's currency, not a hard-coded "$".
        return (
          <span className="font-medium">
            <DiscountCell type={discount.type} value={discount.value} />
          </span>
        );
      },
    },
    modes.tracksMoney && {
      accessorKey: "totalDue",
      header: t("columns.due"),
      // Pay sits beside the amount it settles, not in the actions column, so every row's
      // action icons line up (same as the customer list).
      cell: ({ row }) => {
        const due = row.original.totalDue ?? 0;
        const amount = <MoneyCell value={due} accentClass="text-red-600" />;
        if (!(due > 0) || !modes.onPay) return amount;
        return (
          <div className="flex items-center gap-2">
            {amount}
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => modes.onPay?.(row.original)}
            >
              <HandCoins className="h-3.5 w-3.5" />
              {t("columns.pay")}
            </Button>
          </div>
        );
      },
    },
    {
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
  return columns.filter(
    (column): column is ColumnDef<Supplier> => column !== false,
  );
}
