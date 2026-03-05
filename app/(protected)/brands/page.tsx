"use client";
// Hooks & API
import { brandColumns } from "@/components/brands/columns";
import { brandFilterConfig } from "@/components/brands/filters";
import { brandFormConfig } from "@/components/brands/form-config";
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

const searchConfig = {
  globalSearch: true,
  placeholder: "Search brands by name, description, or status...",
};

const defaultValues = {
  name: "",
  description: "",
  images: [],
  status: "active" as const,
};

export default function BrandsPage() {
  const [viewMode, setViewMode, isMounted] = useViewMode("brands", "card");
  const filteredFormConfig = useFilteredFormConfig(brandFormConfig, "brand");
  const filteredColumns = useFilteredColumns(brandColumns, "brand");
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
    disabledFieldsInEdit: ["description"],
  };

  if(!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Brands Management"
        subTitle="Manage your product brands and their details."
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
      <StatsCard data={getBrandStats(data)} isLoading={isLoading} />

      {/* Table View */}
      {viewMode === "table" && (
        <DataTable
          cardTitle={(dataLength: number) => `All Brands (${dataLength})`}
          defaultPageSize={10}
          pageSizes={[10, 20, 50, 100]}
          filterConfig={brandFilterConfig}
          columns={filteredColumns}
          manageColumns={true}
          module="brand"
          selectable={true}
          searchConfig={searchConfig}
          enableSorting={true}
          defaultColumnVisibility={{ status: false }}
          enableRowHover={true}
          operations={sharedOperations}
        />
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <DataCard
          cardTitle={(n) => `All Brands (${n})`}
          defaultPageSize={12}
          pageSizes={[6, 12, 24, 48]}
          filterConfig={brandFilterConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          searchConfig={searchConfig}
          renderCard={BrandCardView}
          loadingRenderCard={BrandCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}
