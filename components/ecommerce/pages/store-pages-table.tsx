"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { PencilRuler } from "lucide-react";
import { DataTable } from "@/ui/components/dataTable";
import { useDeleteStorefrontPage, type StorefrontPageListItem } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { CustomAction } from "@/types/DataTable";
import { buildPageColumns } from "@/components/ecommerce/pages/columns";
import { pageListOperations } from "@/components/ecommerce/pages/page-list-operations";

const storePages = pageListOperations("content");

/**
 * The store's own pages — About, Contact, the policies.
 *
 * Their own table rather than rows among the landing pages: these carry no ad
 * attribution, and the landing actions do not apply (a policy page is not
 * duplicated, and it is never the homepage). Two actions: the editor, and
 * delete.
 *
 * **Always drawn, even with no rows.** It used to hide itself when a store had
 * none, which was defensible while the only way to get one was the store
 * migration — and wrong the moment a merchant could make one, because the
 * merchant with no store pages is the one who most needs to see that the shop
 * has a place for them.
 */
export function StorePagesTable() {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  const deletePage = useDeleteStorefrontPage();
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
        deleteMutation: deletePage,
        entityName: "Page",
        deleteTooltip: "Delete page",
      }}
    />
  );
}
