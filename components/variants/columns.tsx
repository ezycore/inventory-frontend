// coding-standard: maintained
import { VariantAttribute } from "@/types";
import { sanitize } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ValuesPopover } from "../shared/values-popover";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells";
import type { Translator } from "@/i18n/config";

export const getVariantColumns = (t: Translator): ColumnDef<VariantAttribute>[] => [
  {
    accessorKey: "name",
    header: t("columns.name"),
  },
  {
    accessorKey: "values",
    header: t("columns.values"),
    cell: ({ row }) => {
      const values = sanitize(row.getValue("values"), 'array') as string[];
      return <ValuesPopover values={values} maxVisible={3} />;
    },
  },
  {
    accessorKey: "status",
    header: t("columns.status"),
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status") === "active" ? t("filters.statusActive") : t("filters.statusInactive")}
      </Badge>
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