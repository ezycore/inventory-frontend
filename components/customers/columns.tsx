// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { MoneyCell } from "@/ui/components/dataTable/cells/money-cell";
import { Badge } from "@/ui/components/badge";

/** `t` is bound to the `customers` namespace. */
export function getCustomerColumns(t: Translator): ColumnDef<Customer>[] {
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
    {
      accessorKey: "totalDue",
      header: t("columns.due"),
      cell: ({ row }) => (
        <MoneyCell value={row.original.totalDue ?? 0} accentClass="text-red-600" />
      ),
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
