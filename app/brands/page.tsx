"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import { useMemo } from "react";

// Types
import type { ApiResponse, Brand, PaginatedResponse } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTableCrud } from "@/ui/components/dataTable/crud";
import { ErrorBoundaryFallback } from "@/ui/components/error-boundary-fallback";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";

// Hooks & API
import {
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/hooks/queries";
import { usePageState } from "@/hooks/use-page-state";
import { usePaginationHandler } from "@/hooks/use-pagination-handler";
import { brandsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys-products";

// Column definitions
const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => (
      <AvatarCell
        imageUrl={row.original.logo_url}
        name={row.getValue("name")}
        fallbackIcon={Star}
        showActiveStatus={true}
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

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export default function BrandsPage() {
  const pageState = usePageState<Brand>({ defaultLimit: 10 });
  const { pagination, isMountedRef } = pageState;

  // Fetch brands
  const {
    data: brandsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse<PaginatedResponse<Brand>>>({
    queryKey: ["brands", pagination.page, pagination.limit],
    queryFn: () =>
      brandsApi.getAll({ page: pagination.page, limit: pagination.limit }),
    placeholderData: (previousData) => previousData,
  });

  // Mutation hooks
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  // Extract data
  const brandsData = useMemo(() => {
    return brandsResponse?.data?.items || [];
  }, [brandsResponse]);

  // Pagination handler
  const handlePaginationChange = usePaginationHandler(
    pagination.setPage,
    pagination.setLimit,
    isMountedRef
  );

  if (error) {
    return (
      <ErrorBoundaryFallback
        error={error as Error}
        onRetry={refetch}
        title="Error loading brands"
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-muted-foreground">Manage your product brands.</p>
        </div>
      </div>

      {/* Brands Table with Integrated CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>All Brands ({brandsResponse?.data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableCrud
            columns={columns}
            data={brandsData}
            selectable={true}
            searchConfig={{
              globalSearch: true,
              placeholder: "Search brands by name, description, or status...",
            }}
            crud={{
              formConfig: brandFormConfig,
              createMutation: createBrand,
              updateMutation: updateBrand,
              deleteMutation: deleteBrand,
              entityName: "Brand",
              queryKey: [...queryKeys.brands.all()],
              defaultValues: {
                name: "",
                description: "",
                logo: [],
                status: "active" as const,
              },
              prepareSubmitData: (data, isEdit, item) => {
                const formData = new FormData();
                formData.append("name", data.name);
                formData.append("status", data.status);
                if (data.description) {
                  formData.append("description", data.description);
                }

                // Add logo file if provided
                if (data.logo && data.logo.length > 0) {
                  formData.append("logo", data.logo[0]);
                }

                // Add ID for updates
                if (isEdit && item) {
                  formData.append("id", item._id);
                }

                return formData;
              },
            }}
            enableSorting={true}
            defaultColumnVisibility={{ status: false }}
            enableRowHover={true}
            isLoading={isLoading}
            pagination={{
              pageIndex: pagination.page - 1,
              pageSize: pagination.limit,
              totalPages: brandsResponse?.data?.totalPages,
              totalItems: brandsResponse?.data?.total,
              hasNext: brandsResponse?.data?.hasNext,
              hasPrev: brandsResponse?.data?.hasPrev,
              manualPagination: true,
              pageSizeOptions: [2, 10, 20, 50, 100],
              onPaginationChange: handlePaginationChange,
            }}
            rowClassName={(row) =>
              row.status === "inactive" ? "bg-red-50 opacity-70" : ""
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
