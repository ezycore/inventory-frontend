"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { PencilRuler } from "lucide-react";
import { DataTable } from "@/ui/components/dataTable";
import { useStorefrontPages, type StorefrontPageListItem } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { CustomAction } from "@/types/DataTable";
import { buildPageColumns } from "@/components/ecommerce/pages/columns";
import { pageListOperations } from "@/components/ecommerce/pages/page-list-operations";

const storePages = pageListOperations("content");

/**
 * The store's own pages — About, FAQ, the policies — once they have moved off
 * the Content screen onto the builder.
 *
 * Their own table rather than rows among the landing pages: these carry no ad
 * attribution, and none of the landing actions apply (a policy page is not
 * duplicated, and deleting it here would take an address shoppers and the footer
 * both use). One action, the editor. A store that has not moved its pages sees
 * nothing at all.
 */
export function StorePagesTable() {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  const { data } = useStorefrontPages({ kind: "content", limit: 1 });
  const columns = useMemo(
    () =>
      buildPageColumns({ storeSlug }).filter(
        (column) => (column as { accessorKey?: string }).accessorKey !== "orders",
      ),
    [storeSlug],
  );

  const customActions: CustomAction[] = useMemo(
    () => [
      {
        type: "open-editor",
        placement: "cell",
        tooltip: "Open editor",
        icon: <PencilRuler className="h-4 w-4" />,
        href: (row: StorefrontPageListItem) => `/ecommerce/pages/${row._id}`,
      },
    ],
    [],
  );

  if (!data?.total) return null;

  return (
    <DataTable<StorefrontPageListItem>
      cardTitle={(n) => `Store pages (${n})`}
      columns={columns}
      defaultPageSize={10}
      pageSizes={[10, 20, 50]}
      enableRowHover
      customActions={customActions}
      operations={{
        ...storePages,
        entityName: "Page",
      }}
    />
  );
}
