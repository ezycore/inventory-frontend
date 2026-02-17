'use client'
import { DataTable } from '@/ui/components/dataTable'
import { categoryColumns } from '@/components/categories/columns'
import { categoryFilterConfig } from '@/components/categories/filters'
import { categoryFormConfig } from '@/components/categories/form-config'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useFilteredFormConfig, useFilteredColumns } from '@/hooks/use-filters'
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/services/api'
import { categoriesApi } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'
import PageHeader from '@/ui/components/header'

const searchConfig = {
  globalSearch: true,
  placeholder: "Search categories by name, description, or status...",
}

export default function CategoriesPage() {
  const filteredFormConfig = useFilteredFormConfig(categoryFormConfig, 'category')
  const filteredColumns = useFilteredColumns(categoryColumns, 'category')

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
        columns={filteredColumns}
        manageColumns={true}
        module="category"
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
        operations={{
          isViewAvailable: false,
          formConfig: filteredFormConfig,
          getAllData: categoriesApi.getAll,
          createMutation: useCreateCategory(),
          updateMutation: useUpdateCategory(),
          deleteMutation: useDeleteCategory(),
          queryKey: [...queryKeys.categories.all()],
          entityName: "Category"
        }}
      />
    </div>
  )
}