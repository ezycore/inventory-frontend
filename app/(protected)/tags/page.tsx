"use client";
// coding-standard: maintained

import { useTranslations, useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import { getTagColumns } from "@/components/tags/columns";
import { getTagFilterConfig } from "@/components/tags/filters";
import { getTagFormConfig } from "@/components/tags/form-config";
import { getTagStats } from "@/components/tags/helpers";
import TagCardView from "@/components/tags/cardview";
import TagCardLoading from "@/components/tags/card-loading";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import {
  tagsApi,
  useCreateTag,
  useDeleteTag,
  useTagStats,
  useUpdateTag,
} from "@/services/api";

import { useFilteredFormConfig, useFilteredColumns } from "@/hooks/use-filters";
import { useViewMode } from "@/hooks/use-view-mode";
import { queryKeys } from "@/services/api/query-keys";
import { DataCard } from "@/ui/components/dataCard";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";
import ViewToggle from "@/ui/components/ViewToggle";
import MountingHandler from "@/components/MountingHandler";
import type { TagListItem } from "@/types/api";

const defaultValues = {
  name: "",
  description: "",
  color: "",
  status: "active" as const,
};

export default function TagsPage() {
  const t = useTranslations("products.tags");
  const locale = useLocale() as AppLocale;
  const [viewMode, setViewMode, isMounted] = useViewMode("tags", "card");
  const filteredFormConfig = useFilteredFormConfig(getTagFormConfig(t), "tag");
  const filteredColumns = useFilteredColumns(getTagColumns(t), "tag");
  const tagFilterConfig = getTagFilterConfig(t);
  const { data, isLoading } = useTagStats();

  const sharedOperations = {
    formConfig: filteredFormConfig,
    defaultValues,
    getAllData: tagsApi.getAll,
    createMutation: useCreateTag(),
    updateMutation: useUpdateTag(),
    deleteMutation: useDeleteTag(),
    queryKey: queryKeys.tags.all(),
    entityName: "Tag" as const,
    isViewAvailable: false,
    // No `prepareSubmitData`: tags carry no image, so the form posts plain JSON
    // rather than the FormData the brand and category pages have to assemble.
  };

  const sortingConfig = {
    sortOptions: [
      { field: "name", label: "Name" },
      { field: "createdAt", label: "Date Created" },
      { field: "updatedAt", label: "Last Updated" },
    ],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc" as const,
  };

  if (!isMounted) {
    return <MountingHandler />;
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle
              storageKey="tags"
              defaultView={viewMode}
              onChange={setViewMode}
            />
            <FieldSettingsLink module="tag" />
          </div>
        }
      />

      <StatsCard data={getTagStats(data, t)} isLoading={isLoading} />

      {viewMode === "table" && (
        <DataTable
          cardTitle={(dataLength: number) => t("page.allTagsTitle", { count: dataLength })}
          sortingConfig={sortingConfig}
          defaultPageSize={10}
          pageSizes={[10, 20, 50, 100]}
          filterConfig={tagFilterConfig}
          columns={filteredColumns}
          manageColumns={true}
          module="tag"
          selectable={true}
          enableSorting={true}
          defaultColumnVisibility={{ status: false }}
          rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70 dark:bg-red-950/40" : "")}
          enableRowHover={true}
          operations={sharedOperations}
        />
      )}

      {viewMode === "card" && (
        <DataCard<TagListItem>
          cardTitle={(n) => t("page.allTagsTitle", { count: n })}
          defaultPageSize={12}
          pageSizes={[6, 12, 24, 48]}
          filterConfig={tagFilterConfig}
          sortingConfig={sortingConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          renderCard={(item, actions) => TagCardView(item, actions, { t, locale })}
          loadingRenderCard={TagCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}
