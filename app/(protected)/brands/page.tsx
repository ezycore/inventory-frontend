"use client";
// Hooks & API
import { brandFilterConfig } from "@/components/brands/filters";
import { brandFormConfig } from "@/components/brands/form-config";
import { getBrandStats, prepareSubmitData } from "@/components/brands/helpers";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import {
  brandsApi,
  useBrandStats,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/services/api";

import BrandCardView from "@/components/brands/cardView";
import { useFilteredFormConfig } from "@/hooks/use-filters";
import { queryKeys } from "@/services/api/query-keys";
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";

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
  const filteredFormConfig = useFilteredFormConfig(brandFormConfig, "brand");
  const { data, isLoading } = useBrandStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Brands Management"
        subTitle="Manage your product brands and their details."
        actions={<FieldSettingsLink module="brand" />}
      />

      {/* Stats Cards */}
      <StatsCard data={getBrandStats(data)} isLoading={isLoading} />

      <DataCard
        cardTitle={(n) => `All Brands (${n})`}
        defaultPageSize={6}
        pageSizes={[6, 12, 24]}
        filterConfig={brandFilterConfig}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        searchConfig={searchConfig}
        renderCard={BrandCardView}
        operations={{
          formConfig: filteredFormConfig,
          defaultValues: defaultValues,
          getAllData: brandsApi.getAll,
          createMutation: useCreateBrand(),
          updateMutation: useUpdateBrand(),
          deleteMutation: useDeleteBrand(),
          queryKey: [...queryKeys.brands.all()],
          entityName: "Brand",
          isViewAvailable: false,
          prepareSubmitData,
          disabledFieldsInEdit: ["description"],
        }}
      />
    </div>
  );
}

{
  /* <DataTable
        cardTitle={(dataLength: number) => `All Brands (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[2, 10, 20, 50, 100]}
        filterConfig={brandFilterConfig}
        columns={filteredColumns}
        manageColumns={true}
        module="brand"
        data={data?.items || []}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        loading={isLoading}
        rowClassName={(row: Brand) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: filteredFormConfig,
          defaultValues: defaultValues,
          // getAllData: brandsApi.getAll,
          createMutation: useCreateBrand(),
          updateMutation: useUpdateBrand(),
          deleteMutation: useDeleteBrand(),
          disabledFieldsInEdit: ["name"],
          bulkDeleteMutation: useBulkDeleteBrand(),
          queryKey: [...queryKeys.brands.all()],
          entityName: "Brand",
          isViewAvailable: true,
          editTooltip: "Edit Brand",
          deleteTooltip: "Delete Brand",
          viewTooltip: "Custom tooltip View Brand",
          prepareSubmitData,
        }}
      /> */
}
