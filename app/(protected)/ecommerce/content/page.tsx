"use client";

import { queryKeys } from "@/services/api/query-keys";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import Link from "next/link";
import { contentPagesApi, useCreateContentPage, useDeleteContentPage, useStorefrontPages, useUpdateContentPage, type ContentPage } from "@/services/api";
import { buildContentColumns, cleanContentPage, contentDefaultValues, contentFilterConfig, contentFormConfig, contentPageToForm } from "@/components/ecommerce/content";
import { useStorefrontPreviewToken } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import { useMemo } from "react";

export default function ContentPage() {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  // Fetched regardless of whether the SHOP is published: a draft page on a live
  // shop needs the credential just as much as any page on an unpublished one.
  // Shared react-query cache, so this is the same single request the Customize
  // editor makes.
  const { data: preview } = useStorefrontPreviewToken();
  // Pages that have moved onto the builder: the storefront serves those from
  // there, so this screen marks them and sends edits to the page editor.
  const { data: builderPages } = useStorefrontPages({ kind: "content", limit: 100 });
  const movedPages = useMemo(
    () =>
      new Map(
        (builderPages?.items ?? []).flatMap((page) => (page.slug ? [[page.slug, page._id] as const] : [])),
      ),
    [builderPages],
  );
  const columns = useMemo(
    () => buildContentColumns({ storeSlug, previewToken: preview?.token, movedPages }),
    [storeSlug, preview?.token, movedPages],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        subTitle="Storefront pages (About, FAQ, policies). Published pages can appear in the footer."
      />

      {movedPages.size > 0 ? (
        <p className="rounded-md border bg-muted/50 p-3 text-xs leading-snug text-muted-foreground">
          {movedPages.size === 1 ? "One page is" : `${movedPages.size} pages are`} built from sections now.
          Shoppers see the version in{" "}
          <Link href="/ecommerce/pages" className="font-medium text-primary hover:underline">
            Pages
          </Link>
          , so edit {movedPages.size === 1 ? "it" : "them"} there — changes here no longer reach the shop.
        </p>
      ) : null}

      <DataTable<ContentPage>
        cardTitle={(n) => `All Pages (${n})`}
        columns={columns}
        defaultPageSize={10}
        pageSizes={[10, 20, 50]}
        filterConfig={contentFilterConfig}
        enableSorting
        enableRowHover
        operations={{
          formConfig: contentFormConfig,
          defaultValues: contentDefaultValues,
          getAllData: contentPagesApi.getAll,
          createMutation: useCreateContentPage(),
          updateMutation: useUpdateContentPage(),
          deleteMutation: useDeleteContentPage(),
         openInside: 'drawer', 
          queryKey: queryKeys.contentPages.all(),
          entityName: "Page",
          editTooltip: "Edit page",
          deleteTooltip: "Delete page",
          transformEditData: contentPageToForm,
          // Create → flat ContentPageInput; edit → { body } (DataTable injects
          // id), matching useUpdateContentPage's { id, body } signature.
          prepareSubmitData: (data: ContentPage, isEdit: boolean) => {
            const body = cleanContentPage(data);
            return isEdit ? { body } : body;
          },
        }}
      />
    </div>
  );
}
