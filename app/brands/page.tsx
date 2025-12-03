"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";

// Types
import type { ApiResponse, Brand, PaginatedResponse } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { FilterConfig } from "@/types/filter";

// UI Components
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTableCrud } from "@/ui/components/dataTable/crud";
import { ErrorBoundaryFallback } from "@/ui/components/error-boundary-fallback";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { GlobalFilter } from "@/ui/components/filters/global-filter";

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

// Filter configuration for brands
const brandFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search",
      type: "text",
      placeholder: "Search by name or description...",
    },
    {
      name: "search 2",
      label: "Search 2",
      type: "number",
      placeholder: "Search by name or description...",
    },
    {
      name: "status",
      label: "Status",
      type: "checkbox",
      placeholder: "All statuses",
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
      placeholder: "Select date range",
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

export default function BrandsPage() {
  const pageState = usePageState<Brand>({ defaultLimit: 10 });
  const { pagination, isMountedRef } = pageState;
  
  // Filter state
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Fetch brands with filters
  const {
    data: brandsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse<PaginatedResponse<Brand>>>({
    queryKey: ["brands", pagination.page, pagination.limit, filters],
    queryFn: () =>
      brandsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }),
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

  // Handle filter apply
  const handleFilterApply = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    pagination.setPage(1); // Reset to first page when filtering
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({});
    pagination.setPage(1);
  };

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
      {/* Header with Filter Button */}
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product brands and their details.
          </p>
        </div>
        
        {/* Filter Component */}
        
      {/* Brands Table with Integrated CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Brands ({brandsResponse?.data?.total || 0})
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (filtered)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableCrud
            filterConfig={{
              ...brandFilterConfig,
              onApply: handleFilterApply,
              onReset: handleFilterReset,
            }}
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
                logo_url: [],
                status: "active" as const,
              },
              transformEditData: (item: Brand) => {
                return {
                  name: item.name,
                  description: item.description || "",
                  logo_url: item.logo_url ? [item.logo_url] : [], // Initialize with URL string
                  status: item.status,
                };
              },
              prepareSubmitData: (data, isEdit, item) => {
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
                  } else if (data.logo_url[0] instanceof File) {
                    // User uploaded NEW file (File object)
                    formData.append("logo", data.logo_url[0]);
                  }
                  // If data.logo_url[0] is string (existing URL), do nothing (keep existing)
                } else {
                  // ADD MODE: Upload new file
                  if (data.logo_url && data.logo_url[0] instanceof File) {
                    formData.append("logo", data.logo_url[0]);
                  }
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
