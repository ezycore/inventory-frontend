'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'

// Types
import type { Category, ApiResponse, PaginatedResponse } from '@/types'
import type { DynamicFormConfig } from '@/ui/components/form/type'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { DataTableCrud } from '@/ui/components/dataTable'
import { ErrorBoundaryFallback } from '@/ui/components/error-boundary-fallback'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'

// Hooks & API
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries'
import { usePageState } from '@/hooks/use-page-state'
import { usePaginationHandler } from '@/hooks/use-pagination-handler'
import { categoriesApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys-products'

// Column definitions
const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => (
      <AvatarCell
        name={row.getValue("name")}
        fallbackIcon={Tag}
      />
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-muted-foreground">
        {row.getValue("description") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status") as string}
      </Badge>
    ),
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
const categoryFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Category Name",
      placeholder: "Enter category name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Enter category description",
      rows: 3,
      columnSpan: 12,
      validation: { maxLength: 500 },
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
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
};

export default function CategoriesPage() {
  // Page state management
  const pageState = usePageState<Category>({ defaultLimit: 10 });
  const { pagination, isMountedRef } = pageState;

  // Fetch categories
  const { data: categoriesResponse, isLoading, error, refetch } = useQuery<
    ApiResponse<PaginatedResponse<Category>>
  >({
    queryKey: ['categories', pagination.page, pagination.limit],
    queryFn: () => categoriesApi.getAll({ page: pagination.page, limit: pagination.limit }),
    placeholderData: (previousData) => previousData,
  });

  // Mutation hooks
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Extract data
  const categoriesData = useMemo(() => {
    return categoriesResponse?.data?.items || [];
  }, [categoriesResponse]);

  // Pagination handler
  const handlePaginationChange = usePaginationHandler(
    pagination.setPage,
    pagination.setLimit,
    isMountedRef
  );

  if (error) {
    return <ErrorBoundaryFallback error={error as Error} onRetry={refetch} title="Error loading categories" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products with categories
          </p>
        </div>
      </div>

      {/* Categories Table with Integrated CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categoriesResponse?.data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableCrud
            columns={columns}
            data={categoriesData}
            selectable={true}
            searchConfig={{
              globalSearch: true,
              placeholder: "Search categories by name, description, or status...",
            }}
            crud={{
              formConfig: categoryFormConfig,
              createMutation: createCategory,
              updateMutation: updateCategory,
              deleteMutation: deleteCategory,
              entityName: "Category",
              queryKey: [...queryKeys.category.all()],
              defaultValues: {
                name: "",
                description: "",
                status: "active" as const,
              },
              prepareSubmitData: (data, isEdit, item) => ({
                ...data,
                slug: generateSlug(data.name),
                ...(isEdit && item ? { id: item._id } : {}),
              }),
            }}
            enableSorting={true}
            // defaultColumnVisibility={{ status: false }}
            enableRowHover={true}
            isLoading={isLoading}
            pagination={{
              pageIndex: pagination.page - 1,
              pageSize: pagination.limit,
              totalPages: categoriesResponse?.data?.totalPages,
              totalItems: categoriesResponse?.data?.total,
              hasNext: categoriesResponse?.data?.hasNext,
              hasPrev: categoriesResponse?.data?.hasPrev,
              manualPagination: true,
              pageSizeOptions: [2, 10, 20, 50, 100],
              onPaginationChange: handlePaginationChange,
            }}
            rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          />
        </CardContent>
      </Card>
    </div>
  )
}