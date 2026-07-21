"use client";
// coding-standard: maintained

import { useTranslations, useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/config";
// Hooks & API
import { getBrandColumns } from "@/components/brands/columns";
import { getBrandFilterConfig } from "@/components/brands/filters";
import { getBrandFormConfig } from "@/components/brands/form-config";
import { getBrandStats, prepareSubmitData } from "@/components/brands/helpers";
import BrandCardView from "@/components/brands/cardview";
import BrandCardLoading from "@/components/brands/card-loading";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import {
  brandsApi,
  useBrandStats,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
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
// NOTE: the legacy hand-written `Brand` in types/index.ts, not the generated
// `Brand` — the page's `operations` are typed with it. The two duplicate
// each other and should be reconciled; typed either way beats `any`.
import type { Brand } from "@/types";

const defaultValues = {
  name: "",
  description: "",
  images: [],
  status: "active" as const,
  isDefault: false,
};

export default function BrandsPage() {
  const t = useTranslations("products.brands");
  const locale = useLocale() as AppLocale;
  const [viewMode, setViewMode, isMounted] = useViewMode("brands", "card");
  const filteredFormConfig = useFilteredFormConfig(getBrandFormConfig(t), "brand");
  const filteredColumns = useFilteredColumns(getBrandColumns(t), "brand");
  const brandFilterConfig = getBrandFilterConfig(t);
  const { data, isLoading } = useBrandStats();

  const sharedOperations = {
    formConfig: filteredFormConfig,
    defaultValues: defaultValues,
    getAllData: brandsApi.getAll,
    createMutation: useCreateBrand(),
    updateMutation: useUpdateBrand(),
    deleteMutation: useDeleteBrand(),
    queryKey: [...queryKeys.brands.all()],
    entityName: "Brand" as const,
    isViewAvailable: false,
    prepareSubmitData,
    // disabledFieldsInEdit: ["description"],
  };

  const sortingConfig = {
    sortOptions: [
      { field: "name", label: "Name" },
      { field: "createdAt", label: "Date Created" },
      { field: "updatedAt", label: "Last Updated" },
    ],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc" as const,
  }

  if (!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle
              storageKey="brands"
              defaultView={viewMode}
              onChange={setViewMode}
            />
            <FieldSettingsLink module="brand" />
          </div>
        }
      />

      {/* Stats Cards */}
      <StatsCard data={getBrandStats(data, t)} isLoading={isLoading} />

      {/* Table View */}
      {viewMode === "table" && (
        <DataTable
          cardTitle={(dataLength: number) => t("page.allBrandsTitle", { count: dataLength })}
          sortingConfig={sortingConfig}
          defaultPageSize={10}
          pageSizes={[10, 20, 50, 100]}
          filterConfig={brandFilterConfig}
          columns={filteredColumns}
          manageColumns={true}
          module="brand"
          selectable={true}
          enableSorting={true}
          defaultColumnVisibility={{ status: false }}
          rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          enableRowHover={true}
          operations={sharedOperations}
        />
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <DataCard<Brand>
          cardTitle={(n) => t("page.allBrandsTitle", { count: n })}
          defaultPageSize={12}
          pageSizes={[6, 12, 24, 48]}
          filterConfig={brandFilterConfig}
          sortingConfig={sortingConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          renderCard={(item, actions) => BrandCardView(item, actions, { t, locale })}
          loadingRenderCard={BrandCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}
