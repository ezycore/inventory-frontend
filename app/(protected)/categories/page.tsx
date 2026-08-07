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
import { useVatGatedFormConfig } from '@/hooks/use-vat-gated-form-config'
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useCategoryStats } from '@/services/api'
import { categoriesApi } from '@/services/api'
import { queryKeys } from '@/services/api/query-keys'
import PageHeader from '@/ui/components/header'
import StatsCard from '@/ui/components/StatsCard'
import ViewToggle from '@/ui/components/ViewToggle'
import { useViewMode } from '@/hooks/use-view-mode'
import MountingHandler from '@/components/MountingHandler'
import { getCategoryStats, prepareSubmitData } from '@/components/categories/helper'
import { isVatActive } from '@/lib/feature-utils'
import { useAuthStore } from '@/services/stores'
import { useState } from 'react'
import { Percent } from 'lucide-react'
import { ApplyVatDialog, type ApplyVatTarget } from '@/components/categories/apply-vat-dialog'
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
  const baseFormConfig = useFilteredFormConfig(getCategoryFormConfig(t), 'category')
  const { user } = useAuthStore()
  // The default-VAT-rate picker only means anything while the org charges VAT.
  // Same gate the quick-add "Add New Category" modal runs (useQuickAddModule).
  const filteredFormConfig = useVatGatedFormConfig(baseFormConfig, 'category')
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
    queryKey: queryKeys.categories.all(),
    entityName: "Category" as const,
    prepareSubmitData,
  }
  
  // "Apply this category's VAT rate to its products" — the action a Finance Act
  // rate change needs. Only offered when VAT is on, the user may edit products,
  // and there is a rate to apply.
  //
  // A sub-category inherits its parent's rate, so a child with none of its own
  // still has one to apply as long as the parent does — which is why the list
  // response carries `parent.defaultTaxId`.
  const hasRateToApply = (row: any) =>
    !!(row?.defaultTaxId || row?.parent?.defaultTaxId)
  const [vatTarget, setVatTarget] = useState<ApplyVatTarget | null>(null)
  const canApplyVat =
    isVatActive(user?.organization) &&
    (user?.permissions?.includes('products.edit') ?? false)
  const vatAction = canApplyVat
    ? [
        {
          type: 'apply-vat',
          placement: 'cell' as const,
          icon: <Percent className="h-4 w-4" />,
          tooltip: t('applyVat.tooltip'),
          onClick: (row: any) => setVatTarget(row as ApplyVatTarget),
          hidden: (row: any) => !hasRateToApply(row),
        },
      ]
    : []

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
          customActions={vatAction}
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
          renderCard={(item, actions) =>
            CategoryCardView(
              item,
              {
                ...actions,
                ...(canApplyVat && hasRateToApply(item)
                  ? { onApplyVat: () => setVatTarget(item as ApplyVatTarget) }
                  : {}),
              },
              { t, locale },
            )
          }
          loadingRenderCard={CategoryCardLoading}
          operations={sharedOperations}
        />
      )}

      <ApplyVatDialog
        category={vatTarget}
        onOpenChange={(open) => !open && setVatTarget(null)}
      />
    </div>
  )
}