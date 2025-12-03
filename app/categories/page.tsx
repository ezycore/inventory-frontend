'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'

// Types
import type { Category } from '@/types'
import type { DynamicFormConfig } from '@/ui/components/form/type'
import type { FilterConfig } from '@/types/filter'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { DataTableCrud } from '@/ui/components/dataTable'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'

// Hooks & API
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries'
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
        showActiveStatus={true}
        isActive={row.original.status === "active"}
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

// Filter configuration for categories
const categoryFilterConfig: FilterConfig = {
  fields: [
    {
      name: "category",
      label: "Search category",
      type: "text",
      placeholder: "Search by category name...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
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

export default function CategoriesPage() {
  // Mutation hooks
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

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
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableCrud
            apiConfig={{
              endpoint: categoriesApi,
              queryKey: [...queryKeys.category.all()],
              defaultPageSize: 10,
              pageSizeOptions: [10, 20, 50, 100],
            }}
            filterConfig={categoryFilterConfig}
            columns={columns}
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
                ...(isEdit && item ? { id: item._id } : {}),
              }),
            }}
            defaultColumnVisibility={{ status: false, description: false }}
            enableSorting={true}
            enableRowHover={true}
            rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          />
        </CardContent>
      </Card>
    </div>
  )
}