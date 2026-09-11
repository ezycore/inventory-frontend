"use client";

import { queryKeys } from "@/services/api/query-keys";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import { contentPagesApi, useCreateContentPage, useDeleteContentPage, useUpdateContentPage, type ContentPage } from "@/services/api";
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
  const columns = useMemo(
    () => buildContentColumns({ storeSlug, previewToken: preview?.token }),
    [storeSlug, preview?.token],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        subTitle="Storefront pages (About, FAQ, policies). Published pages can appear in the footer."
      />

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
