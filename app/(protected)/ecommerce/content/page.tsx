"use client";

import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import {
  contentPagesApi,
  useCreateContentPage,
  useDeleteContentPage,
  useUpdateContentPage,
  type ContentPage,
} from "@/services/api";
import {
  contentColumns,
  contentDefaultValues,
  contentFilterConfig,
  contentFormConfig,
  contentSearchConfig,
} from "@/components/ecommerce/content";

function cleanContentPage(data: Record<string, any>) {
  return {
    title: String(data.title ?? "").trim(),
    slug: String(data.slug ?? "").trim(),
    body: data.body ?? "",
    published: !!data.published,
    showInFooter: !!data.showInFooter,
    sortOrder: Number(data.sortOrder) || 0,
  };
}

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        subTitle="Storefront pages (About, FAQ, policies). Published pages can appear in the footer."
      />

      <DataTable<ContentPage>
        cardTitle={(n) => `All Pages (${n})`}
        columns={contentColumns}
        defaultPageSize={10}
        pageSizes={[10, 20, 50]}
        filterConfig={contentFilterConfig}
        searchConfig={contentSearchConfig}
        enableSorting
        enableRowHover
        operations={{
          formConfig: contentFormConfig,
          defaultValues: contentDefaultValues,
          getAllData: contentPagesApi.getAll,
          createMutation: useCreateContentPage(),
          updateMutation: useUpdateContentPage(),
          deleteMutation: useDeleteContentPage(),
          queryKey: ["content-pages"],
          entityName: "Page",
          editTooltip: "Edit page",
          deleteTooltip: "Delete page",
          transformEditData: (p: ContentPage) => ({
            title: p.title,
            slug: p.slug,
            body: p.body ?? "",
            published: !!p.published,
            showInFooter: !!p.showInFooter,
            sortOrder: p.sortOrder ?? 0,
          }),
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
