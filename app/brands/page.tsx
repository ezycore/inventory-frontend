"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Brand } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { FilterConfig } from "@/types/filter";

// UI Components
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/hooks/queries";
import { brandsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys-products";
import PageHeader from "@/ui/components/header";

// Column definitions
const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => (
      <AvatarCell
        imageUrl={row.original.logo_url}
        name={row.getValue("name")}
        isActive={row.original.status === "active"}
      />
    ),
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

// Form configuration
const brandFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Brand Name",
      placeholder: "Enter brand name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Enter brand description",
      rows: 3,
      columnSpan: 12,
      validation: { maxLength: 500 },
    },
    {
      name: "logo_url",
      type: "file-upload",
      label: "Brand Logo",
      placeholder: "Upload brand logo",
      columnSpan: 12,
      accept: "image/*",
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB
      fileTypes: ["jpg", "jpeg", "png", "webp"],
      dropzoneText: "PNG, JPG, WEBP up to 5MB",
      showPreview: true,
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

// Filter configuration for brands
const brandFilterConfig: FilterConfig = {
  fields: [
    {
      name: "brand",
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
  logo_url: [],
  status: "active" as const,
}

const prepareSubmitData = (data: Brand, isEdit: boolean, item: Brand) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("status", data.status);
  if (data.description) {
    formData.append("description", data.description);
  }

  if (isEdit && item) {
    formData.append("id", item._id);

    // EDIT MODE: Handle logo changes
    if (!data.logo_url || data.logo_url.length === 0) {
      // User removed the logo
      formData.append("remove_logo", "true");
    } else if (Array.isArray(data.logo_url) && data.logo_url[0] instanceof File) {
      // User uploaded NEW file (File object)
      formData.append("logo", data.logo_url[0]);
    }
    // If data.logo_url[0] is string (existing URL), do nothing (keep existing)
  } else {
    // ADD MODE: Upload new file
    if (data.logo_url && Array.isArray(data.logo_url) && data.logo_url[0] instanceof File) {
      formData.append("logo", data.logo_url[0]);
    }
  }

  return formData;
}

export default function BrandsPage() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Brands Management" subTitle="Manage your product brands and their details." />

      {/* Brands Table with Integrated CRUD */}
      <DataTable
        cardTitle={(dataLength: number) => `All Brands (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={brandFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        rowClassName={(row) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: brandFormConfig,
          getAllData: brandsApi.getAll,
          createMutation: useCreateBrand(),
          updateMutation: useUpdateBrand(),
          deleteMutation: useDeleteBrand(),
          entityName: "Brand",
          queryKey: [...queryKeys.brands.all()],
          defaultValues: defaultValues,
          transformEditData: (item: Brand) => {
            return {
              ...item,
              logo_url: item.logo_url ? [item.logo_url] : [], // Initialize with URL string
            }
          },
          prepareSubmitData: (data: Brand, isEdit: boolean, item: Brand) => prepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
