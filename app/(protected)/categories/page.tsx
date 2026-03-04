'use client'
import { DataTable } from '@/ui/components/dataTable'
import { DataCard } from '@/ui/components/dataCard'
import { categoryColumns } from '@/components/categories/columns'
import { categoryFilterConfig } from '@/components/categories/filters'
import { categoryFormConfig } from '@/components/categories/form-config'
import CategoryCardView from '@/components/categories/cardview'
import CategoryCardLoading from '@/components/categories/card-loading'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useFilteredFormConfig, useFilteredColumns } from '@/hooks/use-filters'
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useCategoryStats } from '@/services/api'
import { categoriesApi } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'
import PageHeader from '@/ui/components/header'
import StatsCard, { type StatData } from '@/ui/components/StatsCard'
import ViewToggle from '@/ui/components/ViewToggle'
import { useViewMode } from '@/hooks/use-view-mode'
import MountingHandler from '@/components/MountingHandler'
import { getCategoryStats } from '@/components/categories/helper'

const searchConfig = {
  globalSearch: true,
  placeholder: "Search categories by name, description, or status...",
}

export default function CategoriesPage() {
  const [viewMode, setViewMode, isMounted] = useViewMode('categories', 'card')
  const filteredFormConfig = useFilteredFormConfig(categoryFormConfig, 'category')
  const filteredColumns = useFilteredColumns(categoryColumns, 'category')
  const { data: statsData, isLoading: statsLoading } = useCategoryStats?.() ?? { data: undefined, isLoading: false }

  const sharedOperations = {
    isViewAvailable: false,
    formConfig: filteredFormConfig,
    getAllData: categoriesApi.getAll,
    createMutation: useCreateCategory(),
    updateMutation: useUpdateCategory(),
    deleteMutation: useDeleteCategory(),
    queryKey: [...queryKeys.categories.all()],
    entityName: "Category" as const,
  }

  if(!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <PageHeader 
        title="Categories" 
        subTitle="Organize your products with categories"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle
              storageKey="categories"
              defaultView={viewMode}
              onChange={setViewMode}
            />
            <FieldSettingsLink module="category" />
          </div>
        }
      />

      {/* Stats Cards */}
      <StatsCard data={getCategoryStats(statsData)} isLoading={statsLoading} />

      {/* Table View */}
      {viewMode === 'table' && (
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
          operations={sharedOperations}
        />
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <DataCard
          cardTitle={(n) => `All Categories (${n})`}
          defaultPageSize={12}
          pageSizes={[12, 24, 48]}
          filterConfig={categoryFilterConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          searchConfig={searchConfig}
          renderCard={CategoryCardView}
          loadingRenderCard={CategoryCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  )
}