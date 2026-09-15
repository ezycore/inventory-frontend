"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { Copy, PencilRuler, Plus } from "lucide-react";
import { queryKeys } from "@/services/api/query-keys";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import {
  storefrontPagesApi,
  useDeleteStorefrontPage,
  useDuplicateStorefrontPage,
  type StorefrontPageListItem,
  type StorefrontPageListParams,
} from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { CustomAction } from "@/types/DataTable";
import { buildPageColumns } from "@/components/ecommerce/pages/columns";
import { NewPageDialog } from "@/components/ecommerce/pages/new-page-dialog";

/**
 * Landing pages only. The builder API also holds content and system pages, but
 * content pages keep the Content screen until Phase 4 and system pages arrive in
 * Phase 5 — listing them here would offer a Delete the backend refuses.
 */
const listLandingPages = (params: StorefrontPageListParams = {}) =>
  storefrontPagesApi.list({ ...params, kind: "landing" });

export default function StorefrontPagesPage() {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  const [creating, setCreating] = useState(false);
  const { mutate: duplicatePage, isPending: duplicating } = useDuplicateStorefrontPage();
  const deletePage = useDeleteStorefrontPage();
  const columns = useMemo(() => buildPageColumns({ storeSlug }), [storeSlug]);

  const customActions: CustomAction[] = useMemo(
    () => [
      {
        type: "create",
        placement: "header",
        label: "New landing page",
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setCreating(true),
      },
      {
        type: "open-editor",
        placement: "cell",
        tooltip: "Open editor",
        icon: <PencilRuler className="h-4 w-4" />,
        href: (row: StorefrontPageListItem) => `/ecommerce/pages/${row._id}`,
      },
      {
        type: "duplicate",
        placement: "cell",
        tooltip: "Duplicate",
        icon: <Copy className="h-4 w-4" />,
        onClick: (row: StorefrontPageListItem) => duplicatePage(row._id),
        disabled: () => duplicating,
      },
    ],
    [duplicatePage, duplicating],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        subTitle="Landing pages for your ads and offers, built from sections. Each one has its own address on your store."
      />

      <DataTable<StorefrontPageListItem>
        cardTitle={(n) => `Landing pages (${n})`}
        columns={columns}
        defaultPageSize={10}
        pageSizes={[10, 20, 50]}
        enableRowHover
        customActions={customActions}
        operations={{
          getAllData: listLandingPages,
          deleteMutation: deletePage,
          queryKey: queryKeys.storefrontPages.lists(),
          entityName: "Page",
          deleteTooltip: "Delete page",
        }}
      />

      <NewPageDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
