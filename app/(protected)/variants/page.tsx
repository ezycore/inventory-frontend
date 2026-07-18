'use client'
// coding-standard: maintained

import { useTranslations, useLocale } from 'next-intl'

// Types
import type { VariantAttribute } from '@/types'
import type { AppLocale } from '@/i18n/config'

// UI Components
import { DataTable } from '@/ui/components/dataTable'
import { DataCard } from '@/ui/components/dataCard'
import PageHeader from '@/ui/components/header'
import StatsCard from '@/ui/components/StatsCard'
import ViewToggle from '@/ui/components/ViewToggle'
import VariantCardView from '@/components/variants/cardview'
import VariantCardLoading from '@/components/variants/card-loading'

// Hooks & API
import {
  useCreateVariantAttribute,
  useUpdateVariantAttribute,
  useDeleteVariantAttribute,
  useVariantStats,
} from '@/services/api'
import { variantAttributesApi } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'
import getVariantAttributeFormConfig from '@/components/variants/form-config'
import { useViewMode } from '@/hooks/use-view-mode'
import MountingHandler from '@/components/MountingHandler'
import { getVariantStats } from '@/components/variants/helper'
import { getVariantColumns } from '@/components/variants/columns'
import { getVariantFilterConfig } from '@/components/variants/filter'

export default function VariantsPage() {
  const t = useTranslations('products.variants')
  const locale = useLocale() as AppLocale
  const [viewMode, setViewMode, isMounted] = useViewMode('variants', 'card')
  const { data: statsData, isLoading: statsLoading } = useVariantStats()

  const sharedOperations = {
    getAllData: variantAttributesApi.getAll,
    formConfig: getVariantAttributeFormConfig(t),
    createMutation: useCreateVariantAttribute(),
    updateMutation: useUpdateVariantAttribute(),
    deleteMutation: useDeleteVariantAttribute(),
    entityName: t('page.entityName'),
    queryKey: [...queryKeys.variantAttributes.all()],
    transformEditData: variantAttributesApi.transformForEdit,
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

  if (!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={t('page.title')}
        subTitle={t('page.subtitle')}
        actions={
          <ViewToggle
            storageKey="variants"
            defaultView={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {/* Stats Cards */}
      <StatsCard data={getVariantStats(statsData, t)} isLoading={statsLoading} />

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable<VariantAttribute>
          cardTitle={(dataLength: number) => t('page.allVariantsTitle', { count: dataLength })}
          columns={getVariantColumns(t)}
          selectable={true}
          operations={sharedOperations}
          filterConfig={getVariantFilterConfig(t)}
          enableSorting={true}
          sortingConfig={sortingConfig}
          defaultColumnVisibility={{ status: false }}
          enableRowHover={true}
          rowClassName={(row) =>
            row.status === "inactive" ? "bg-red-50 opacity-70" : ""
          }
        />
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <DataCard
          cardTitle={(n) => t('page.allVariantsTitle', { count: n })}
          defaultPageSize={12}
          sortingConfig={sortingConfig}
          pageSizes={[6, 12, 24, 48]}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          filterConfig={getVariantFilterConfig(t)}
          renderCard={(item, actions) => VariantCardView(item, actions, { t, locale })}
          loadingRenderCard={VariantCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}