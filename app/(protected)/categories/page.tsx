'use client'
// coding-standard: maintained

import { useTranslations, useLocale } from 'next-intl'
import { DataTable } from '@/ui/components/dataTable'
import { DataCard } from '@/ui/components/dataCard'
import { getCategoryColumns } from '@/components/categories/columns'
import { getCategoryFilterConfig } from '@/components/categories/filters'
import { getCategoryFormConfig } from '@/components/categories/form-config'
import CategoryCardView from '@/components/categories/cardview'
import CategoryCardLoading from '@/components/categories/card-loading'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useFilteredFormConfig, useFilteredColumns } from '@/hooks/use-filters'
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useCategoryStats } from '@/services/api'
import { categoriesApi } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'
import PageHeader from '@/ui/components/header'
import StatsCard from '@/ui/components/StatsCard'
import ViewToggle from '@/ui/components/ViewToggle'
import { useViewMode } from '@/hooks/use-view-mode'
import MountingHandler from '@/components/MountingHandler'
import { getCategoryStats, prepareSubmitData } from '@/components/categories/helper'
import type { AppLocale } from '@/i18n/config'
// NOTE: the legacy hand-written `Category` in types/index.ts, not the generated
// `Category` — the page's `operations` are typed with it. The two duplicate
// each other and should be reconciled; typed either way beats `any`.
import type { Category } from "@/types";

const defaultValues = {
  name: "",
  description: "",
  images: [],
  status: "active" as const,
  isDefault: false,
}

export default function CategoriesPage() {
  const t = useTranslations('products.categories')
  const locale = useLocale() as AppLocale
  const [viewMode, setViewMode, isMounted] = useViewMode('categories', 'card')
  const filteredFormConfig = useFilteredFormConfig(getCategoryFormConfig(t), 'category')
  const filteredColumns = useFilteredColumns(getCategoryColumns(t), 'category')
  const categoryFilterConfig = getCategoryFilterConfig(t)
  const { data: statsData, isLoading: statsLoading } = useCategoryStats?.() ?? { data: undefined, isLoading: false }

  const sharedOperations = {
    isViewAvailable: false,
    formConfig: filteredFormConfig,
    defaultValues: defaultValues,
    getAllData: categoriesApi.getAll,
    createMutation: useCreateCategory(),
    updateMutation: useUpdateCategory(),
    deleteMutation: useDeleteCategory(),
    queryKey: [...queryKeys.categories.all()],
    entityName: "Category" as const,
    prepareSubmitData,
  }
  
  const sortingConfig = {
    sortOptions: [
      { field: "name", label: "Name" },
      { field: "createdAt", label: "Date Created" },
      { field: "updatedAt", label: "Last Updated" },
    ],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc" as const,
  }

  if(!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={t('page.title')}
        subTitle={t('page.subtitle')}
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
      <StatsCard data={getCategoryStats(statsData, t)} isLoading={statsLoading} />

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          cardTitle={(dataLength: number) => t('page.allCategoriesTitle', { count: dataLength })}
          defaultPageSize={10}
          pageSizes={[10, 20, 50, 100]}
          filterConfig={categoryFilterConfig}
          columns={filteredColumns}
          sortingConfig={sortingConfig}
          manageColumns={true}
          module="category"
          selectable={true}
          enableSorting={true}
          defaultColumnVisibility={{ status: false }}
          enableRowHover={true}
          rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          operations={sharedOperations}
        />
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <DataCard<Category>
          cardTitle={(n) => t('page.allCategoriesTitle', { count: n })}
          defaultPageSize={12}
          pageSizes={[6, 12, 24, 48]}
          filterConfig={categoryFilterConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          sortingConfig={sortingConfig}
          renderCard={(item, actions) => CategoryCardView(item, actions, { t, locale })}
          loadingRenderCard={CategoryCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  )
}