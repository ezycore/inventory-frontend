"use client";

// Types
import  type {Brand} from "@/types";
// UI Components
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import { brandColumns } from "@/components/brands/columns";
import { brandFilterConfig } from "@/components/brands/filters";
import { brandFormConfig } from "@/components/brands/form-config";
import { prepareSubmitData } from "@/components/brands/helpers";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import {
  useBrands,
  useBulkDeleteBrand,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/services/api";
import { useFilteredColumns, useFilteredFormConfig } from "@/hooks/use-filters";
import { queryKeys } from "@/services/api/query-keys";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";
import { breakdrownData } from "@/utils";

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
  const filteredColumns = useFilteredColumns(brandColumns, "brand");
  const { data, isLoading } = useBrands();
  const breakdownWithStatus = breakdrownData(data?.items || [], "status");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Brands Management"
        subTitle="Manage your product brands and their details."
        actions={<FieldSettingsLink module="brand" />}
      />

      {/* Stats Cards */}
      <StatsCard data={[
        { label: "Total Brands", value: data?.total || 0, labelColor: "#3B82F6", color: "#3B82F6", bg: "#EFF6FF" },
        { label: "Active", value: breakdownWithStatus.active || 0, labelColor: "#10B981", color: "#10B981", bg: "#ECFDF5" },
        { label: "Inactive", value: breakdownWithStatus.inactive || 0, labelColor: "#F59E0B", color: "#F59E0B", bg: "#FFFBEB" },
        { label: "Total Products", value: data?.totalProducts || 0, labelColor: "#8B5CF6", color: "#8B5CF6", bg: "#F5F3FF" },
      ]} isLoading={isLoading} />

      <DataTable
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
      />
    </div>
  );
}
