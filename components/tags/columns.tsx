// coding-standard: maintained
import type { TagListItem } from "@/types/api";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells";
import { ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import Link from "next/link";
import type { Translator } from "@/i18n/config";

/**
 * The name cell renders the tag exactly as it appears on a product row — same
 * chip, same colour — so a merchant picking a colour here can see what they are
 * choosing rather than reading a hex value.
 */
export const getTagColumns = (t: Translator): ColumnDef<TagListItem>[] => [
  {
    accessorKey: "name",
    header: t("columns.name"),
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="font-medium"
        style={
          row.original.color
            ? { borderColor: row.original.color, color: row.original.color }
            : undefined
        }
      >
        {row.original.name}
      </Badge>
    ),
  },
  {
    accessorKey: "description",
    header: t("columns.description"),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.description || "—"}
      </span>
    ),
  },
  {
    accessorKey: "productCount",
    header: t("columns.products"),
    cell: ({ row }) => {
      const count = row.original.productCount ?? 0;
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          {count > 0 ? (
            // The products list filters tags by id, OR-combined.
            <Link href={`/products?tags=${row.original._id}`} className="hover:underline">
              {t("columns.productsCount", { count })}
            </Link>
          ) : (
            <span>{t("columns.productsCount", { count })}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("columns.status"),
  },
  {
    accessorKey: "createdAt",
    header: t("columns.createdDate"),
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
];
