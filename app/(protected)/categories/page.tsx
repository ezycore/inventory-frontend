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
import { CheckCircle2, Tag, XCircle, ShoppingBag } from 'lucide-react'

const searchConfig = {
  globalSearch: true,
  placeholder: "Search categories by name, description, or status...",
}

function getCategoryStats(stats: Record<string, any> | undefined): StatData[] {
  return [
    {
      label: "Total Categories",
      value: stats?.total || 0,
      icon: Tag,
      variant: "primary",
      description: "All registered categories",
    },
    {
      label: "Active",
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      description: "Currently active",
    },
    {
      label: "Inactive",
      value: stats?.inactive || 0,
      icon: XCircle,
      variant: "warning",
      description: "Currently inactive",
    },
    {
      label: "Total Products",
      value: stats?.totalProducts || 0,
      icon: ShoppingBag,
      variant: "info",
      description: "Across all categories",
    },
  ]
}

export default function CategoriesPage() {
  const [viewMode, setViewMode] = useViewMode('categories', 'card')
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

  return (
    <div className="container mx-auto p-6 space-y-6">
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