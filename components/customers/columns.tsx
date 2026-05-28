import { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/types";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
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

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Customer Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "creditBalance",
    header: "Credit Balance",
    cell: ({ row }) => (
      <CreditBalanceCell value={(row.original.creditBalance as number) ?? 0} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];
