// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { Badge } from "@/ui/components/badge";
import { useCurrency } from "@/lib/currency";

function CreditBalanceCell({ value }: { value: number }) {
  const { format } = useCurrency();
  return (
    <span
      className={value > 0 ? "font-medium text-blue-600" : "text-muted-foreground"}
    >
      {format(value)}
    </span>
  );
}

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
      accessorKey: "creditBalance",
      header: t("columns.creditBalance"),
      cell: ({ row }) => (
        <CreditBalanceCell value={(row.original.creditBalance as number) ?? 0} />
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
