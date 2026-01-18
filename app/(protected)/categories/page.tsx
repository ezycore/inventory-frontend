'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'

// Types
import type { Category } from '@/types'

// UI Components
import { DataTable } from '@/ui/components/dataTable'
import { DateCell } from '@/ui/components/dataTable/cells'
import { AvatarCell } from '@/ui/components/dataTable/cells'

// Hooks & API
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries'
import { categoriesApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys-products'
import PageHeader from '@/ui/components/header'
import { FilterConfig } from '@/types/DataTable'
import { categoryFormConfig } from '@/components/categories/form-config'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useFilteredFormConfig } from '@/hooks/use-filtered-form-config'

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

// Filter configuration for categories
const categoryFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
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

export default function CategoriesPage() {
  const filteredFormConfig = useFilteredFormConfig(categoryFormConfig, 'category')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title="Categories" 
        subTitle="Organize your products with categories"
        actions={<FieldSettingsLink module="category" />}
      />

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
          formConfig: filteredFormConfig,
          getAllData: categoriesApi.getAll,
          createMutation: useCreateCategory(),
          updateMutation: useUpdateCategory(),
          deleteMutation: useDeleteCategory(),
          queryKey: [...queryKeys.category.all()],
          isViewAvailable: true,
          entityName: "Category"
        }}
      />
    </div>
  )
}