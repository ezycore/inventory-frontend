// coding-standard: maintained
import type { Supplier } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { useCurrency } from "@/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";

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
