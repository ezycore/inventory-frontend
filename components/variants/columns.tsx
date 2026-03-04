import { VariantAttribute } from "@/types";
import { sanitize } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ValuesPopover } from "../shared/values-popover";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells";

export const variantColumns: ColumnDef<VariantAttribute>[] = [
  {
    accessorKey: "name",
    header: "Attribute Name"
  },
  {
    accessorKey: "values",
    header: "Values",
    cell: ({ row }) => {
      const values = sanitize(row.getValue("values"), 'array') as string[];
      return <ValuesPopover values={values} maxVisible={3} />;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status") as string}
      </Badge>
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