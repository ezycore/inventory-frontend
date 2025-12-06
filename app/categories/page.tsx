'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'

// Types
import type { Category } from '@/types'
import type { DynamicFormConfig } from '@/ui/components/form/type'
import type { FilterConfig } from '@/types/filter'

// UI Components
import { DataTable } from '@/ui/components/dataTable'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'

// Hooks & API
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useCategories } from '@/hooks/queries'
import { categoriesApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys-products'
import PageHeader from '@/ui/components/header'

// Column definitions
const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => (
      <AvatarCell
        name={row.getValue("name")}
        fallbackIcon={Tag}
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
  placeholder: "Search categories by name, description, or status...",
}

const defaultValues = {
  name: "",
  description: "",
  status: "active" as const,
}

export default function CategoriesPage() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Categories" subTitle="Organize your products with categories" />

      {/* Categories Table with Integrated CRUD */}
      <DataTable
        cardTitle={(dataLength: number) => `All Categories (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={categoryFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
        operations={{
          formConfig: categoryFormConfig,
          getAllData: categoriesApi.getAll,
          createMutation: useCreateCategory(),
          updateMutation: useUpdateCategory(),
          deleteMutation: useDeleteCategory(),
          entityName: "Category",
          queryKey: [...queryKeys.category.all()],
          defaultValues: defaultValues,
          prepareSubmitData: (data: Category, isEdit: boolean, item: Category) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
    </div>
  )
}