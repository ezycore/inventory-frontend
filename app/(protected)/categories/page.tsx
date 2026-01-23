'use client'

// Types
import type { Category } from '@/types'

// UI Components
import { DataTable } from '@/ui/components/dataTable'

// Hooks & API
import { categoryColumns } from '@/components/categories/columns'
import { categoryFilterConfig } from '@/components/categories/filters'
import { categoryFormConfig } from '@/components/categories/form-config'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries'
import { useFilteredFormConfig } from '@/hooks/use-filtered-form-config'
import { categoriesApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys-products'
import PageHeader from '@/ui/components/header'

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
        columns={categoryColumns}
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