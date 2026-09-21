"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { Copy, HousePlus, PencilRuler, Plus, Undo2 } from "lucide-react";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import {
  useDeleteStorefrontPage,
  useDuplicateStorefrontPage,
  useSetStorefrontHomePage,
  type StorefrontPageListItem,
} from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { CustomAction } from "@/types/DataTable";
import { buildPageColumns } from "@/components/ecommerce/pages/columns";
import { HomePageCard } from "@/components/ecommerce/pages/home-page-card";
import { HomepageDialog } from "@/components/ecommerce/pages/homepage-dialog";
import { NewPageDialog } from "@/components/ecommerce/pages/new-page-dialog";
import { pageListOperations } from "@/components/ecommerce/pages/page-list-operations";
import { StorePagesTable } from "@/components/ecommerce/pages/store-pages-table";
import { SystemPagesCard } from "@/components/ecommerce/pages/system-pages-card";

/**
 * Landing pages in the table. The builder API also holds content and system
 * pages, and listing those here would offer a Duplicate and a Delete the backend
 * refuses; a home page that is a builder page has its own card above
 * (`HomePageCard`), moved content pages have `StorePagesTable`, and system pages
 * `SystemPagesCard`.
 */
const landingPages = pageListOperations("landing");

export default function StorefrontPagesPage() {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  const [creating, setCreating] = useState(false);
  const [homepageFor, setHomepageFor] = useState<StorefrontPageListItem | null>(null);
  const { mutate: duplicatePage, isPending: duplicating } = useDuplicateStorefrontPage();
  const { mutate: setHomePage, isPending: settingHome } = useSetStorefrontHomePage();
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
      {
        type: "use-as-homepage",
        placement: "cell",
        tooltip: "Use as homepage",
        icon: <HousePlus className="h-4 w-4" />,
        onClick: (row: StorefrontPageListItem) => setHomepageFor(row),
        // Only a live page can be the homepage — the backend refuses anything else.
        hidden: (row: StorefrontPageListItem) => row.isHome || row.status !== "published",
      },
      {
        type: "stop-homepage",
        placement: "cell",
        tooltip: "Stop using as homepage",
        icon: <Undo2 className="h-4 w-4" />,
        onClick: () => setHomePage(null),
        hidden: (row: StorefrontPageListItem) => !row.isHome,
        disabled: () => settingHome,
      },
    ],
    [duplicatePage, duplicating, setHomePage, settingHome],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        subTitle="Landing pages for your ads and offers, built from sections. Each one has its own address on your store."
      />

      <HomePageCard />

      <DataTable<StorefrontPageListItem>
        cardTitle={(n) => `Landing pages (${n})`}
        columns={columns}
        defaultPageSize={10}
        pageSizes={[10, 20, 50]}
        enableRowHover
        customActions={customActions}
        operations={{
          ...landingPages,
          deleteMutation: deletePage,
          entityName: "Page",
          deleteTooltip: "Delete page",
        }}
      />

      <StorePagesTable />
      <SystemPagesCard />

      <NewPageDialog open={creating} onOpenChange={setCreating} />
      <HomepageDialog page={homepageFor} onClose={() => setHomepageFor(null)} />
    </div>
  );
}
