// coding-standard: maintained
import { Brand } from "@/types";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells";
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import Link from "next/link";
import type { Translator } from "@/i18n/config";

export const getBrandColumns = (t: Translator): ColumnDef<Brand>[] => [
  {
    accessorKey: "name",
    header: t("columns.name"),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <AvatarCell
            imageUrl={row.original.images?.[0]?.thumbnailUrl}
            name={row.getValue("name")}
            isActive={row.original.status === "active"}
          />
          {row.original.isDefault && (
            <Badge
              variant="outline"
              className="text-xs shrink-0 border-primary text-primary"
            >
              {t("columns.default")}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "productCount",
    header: t("columns.products"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        {row.original.productCount > 0 ? (
          <Link href={`/products?categoryId=${row.original._id}`} className="hover:underline">
            {t("columns.productsCount", { count: row.original.productCount || 0 })}
          </Link>
        ) : (
          <span>{t("columns.productsCount", { count: row.original.productCount || 0 })}</span>
        )}
      </div>
    ),
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
  {
    accessorKey: "updatedAt",
    header: t("columns.updatedDate"),
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];
