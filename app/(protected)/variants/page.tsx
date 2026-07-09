'use client'

// Types
import type { VariantAttribute } from '@/types'

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
import variantAttributeFormConfig from '@/components/variants/form-config'
import { useViewMode } from '@/hooks/use-view-mode'
import MountingHandler from '@/components/MountingHandler'
import { getVariantStats } from '@/components/variants/helper'
import { variantColumns } from '@/components/variants/columns'
import { variantFilterConfig } from '@/components/variants/filter'


const searchConfig = {
  globalSearch: true,
  placeholder: "Search attributes by name, values",
}

export default function VariantsPage() {
  const [viewMode, setViewMode, isMounted] = useViewMode('variants', 'card')
  const { data: statsData, isLoading: statsLoading } = useVariantStats()

  const sharedOperations = {
    getAllData: variantAttributesApi.getAll,
    formConfig: variantAttributeFormConfig,
    createMutation: useCreateVariantAttribute(),
    updateMutation: useUpdateVariantAttribute(),
    deleteMutation: useDeleteVariantAttribute(),
    entityName: "Variant Attribute" as const,
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
        title="Variants"
        subTitle="Options of the same product — like size, strength, or pack."
        actions={
          <ViewToggle
            storageKey="variants"
            defaultView={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {/* Stats Cards */}
      <StatsCard data={getVariantStats(statsData)} isLoading={statsLoading} />

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable<VariantAttribute>
          cardTitle={(dataLength: number) => `All Variants (${dataLength})`}
          columns={variantColumns}
          selectable={true}
          searchConfig={searchConfig}
          operations={sharedOperations}
          filterConfig={variantFilterConfig}
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
          cardTitle={(n) => `All Variants (${n})`}
          defaultPageSize={12}
          sortingConfig={sortingConfig}
          pageSizes={[6, 12, 24, 48]}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          filterConfig={variantFilterConfig}
          searchConfig={searchConfig}
          renderCard={VariantCardView}
          loadingRenderCard={VariantCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}