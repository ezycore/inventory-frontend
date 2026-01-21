"use client";

// Types
import type { Brand } from "@/types";
// UI Components
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  brandColumns,
  brandFilterConfig,
  brandFormConfig,
  brandPrepareSubmitData,
} from "@/components/brands/constants";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import {
  useBulkDeleteBrand,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/hooks/queries";
import { useFilteredFormConfig } from "@/hooks/use-filtered-form-config";
import { brandsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys-products";
import PageHeader from "@/ui/components/header";

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Brands Management"
        subTitle="Manage your product brands and their details."
        actions={<FieldSettingsLink module="brand" />}
      />

      <DataTable
        cardTitle={(dataLength: number) => `All Brands (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[2, 10, 20, 50, 100]}
        filterConfig={brandFilterConfig}
        columns={brandColumns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        rowClassName={(row: Brand) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: filteredFormConfig,
          defaultValues: defaultValues,
          getAllData: brandsApi.getAll,
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
          prepareSubmitData: (data: Brand, isEdit: boolean, item?: Brand) =>
            brandPrepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
