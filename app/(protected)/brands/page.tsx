"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Brand } from "@/types";
// UI Components
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  useCreateBrand,
  useDeleteBrand,
  useBulkDeleteBrand,
  useUpdateBrand,
} from "@/hooks/queries";
import { brandsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys-products";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";
import { brandFormConfig } from "@/components/brands/form-config";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import { useFilteredFormConfig } from "@/hooks/use-filtered-form-config";

// Column definitions
const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => {      
      return (
        <AvatarCell
          imageUrl={row.original.images?.[0]?.thumbnailUrl}
          name={row.getValue("name")}
          isActive={row.original.status === "active"}
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];



// Filter configuration for brands
const brandFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search brand",
      type: "text",
      placeholder: "Search by brand...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 1,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "createdAt",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
    {
      name: "updatedAt",
      label: "Updated Date",
      type: "date",
      placeholder: "Select date",
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search brands by name, description, or status...",
};

const defaultValues = {
  name: "",
  description: "",
  images: [],
  status: "active" as const,
}

const prepareSubmitData = (data: Brand, isEdit: boolean, item?: Brand) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("status", data.status);
  if (data.description) {
    formData.append("description", data.description);
  }

  if (isEdit && item) {
    // EDIT MODE: Handle image changes
    const existingImages = item.images || [];
    const currentImages = data.images || [];

    // Detect removed images (compare publicIds)
    const existingPublicIds = existingImages.map((img: any) => img.publicId);
    const currentPublicIds = currentImages
      .filter((img: any) => typeof img === 'object' && img.publicId)
      .map((img: any) => img.publicId);
    
    const removedImageIds = existingPublicIds.filter(
      (id: string) => !currentPublicIds.includes(id)
    );

    if (removedImageIds.length > 0) {
      formData.append("removeImages", JSON.stringify(removedImageIds));
    }

    // Append new files (File objects) - use a type guard so currentImages narrows to File[]
        const newFiles = (currentImages as unknown[]).filter((img): img is File => img instanceof File);
        newFiles.forEach((file) => {
          formData.append("images", file);
        });
  } else {
    // ADD MODE: Upload new files
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((file: any) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    }
  }

  return formData;
}

export default function BrandsPage() {
  const filteredFormConfig = useFilteredFormConfig(brandFormConfig, 'brand')

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
        columns={columns}
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
          bulkDeleteMutation: useBulkDeleteBrand(),
          queryKey: [...queryKeys.brands.all()],
          entityName: "Brand",
          isViewAvailable: true,
          editTooltip: "Edit Brand",
          deleteTooltip: "Delete Brand",
          viewTooltip: "Custom tooltip View Brand",
          prepareSubmitData: (data: Brand, isEdit: boolean, item?: Brand) => prepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
