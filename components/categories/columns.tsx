// coding-standard: maintained
import { ColumnDef } from '@tanstack/react-table'
import { Package, Tag } from 'lucide-react'
import type { Category } from '@/types'
import { Badge } from '@/ui/components/badge'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { categoryProductsHref } from './helper'
import Link from 'next/link'
import type { Translator } from '@/i18n/config'

export const getCategoryColumns = (t: Translator): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    header: t("columns.name"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <AvatarCell
          imageUrl={row.original.images?.[0]?.thumbnailUrl}
          name={row.getValue("name")}
          fallbackIcon={Tag}
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
    ),
  },
  {
    // A sub-category is otherwise indistinguishable from a top-level one in a
    // flat table, and the two behave differently (no default flag, no own VAT
    // rate, a two-segment URL). The level chip says which this is at a glance.
    accessorKey: "parentId",
    header: t("columns.parent"),
    cell: ({ row }) => {
      // `parentId` says WHETHER this is a sub-category; `parent` carries the
      // name to show. They are two fields on purpose — the edit form binds its
      // parent select to the raw id, so the backend cannot populate it in place.
      // `parent` is a plain lookup that can miss (a parent deleted out from
      // under a child), hence the generic label as a fallback rather than a gap.
      const { parentId, parent } = row.original as typeof row.original & {
        parent?: { name?: string } | null;
      };

      if (!parentId) {
        return (
          <Badge variant="secondary" className="text-xs">
            {t("columns.topLevel")}
          </Badge>
        );
      }
      return (
        <span className="text-sm text-muted-foreground">
          {parent?.name ?? t("columns.subcategory")}
        </span>
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
          <Link href={categoryProductsHref(row.original)} className="hover:underline">
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
