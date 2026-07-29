// coding-standard: maintained
import type { Supplier } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { MoneyCell } from "@/ui/components/dataTable/cells/money-cell";
import type { ColumnDef } from "@tanstack/react-table";

/** `t` is bound to the `suppliers` namespace. */
export function getSupplierColumns(t: Translator): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
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
}
