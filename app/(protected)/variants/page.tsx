'use client'

import { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, Hash, Palette, XCircle } from 'lucide-react'

// Types
import type { VariantAttribute } from '@/types'

// UI Components
import { Badge } from '@ui/components/badge'
import { DateCell } from '@/ui/components/dataTable/cells/date-cell'
import { DataTable } from '@/ui/components/dataTable'
import { DataCard } from '@/ui/components/dataCard'
import PageHeader from '@/ui/components/header'
import StatsCard, { type StatData } from '@/ui/components/StatsCard'
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
import { sanitize } from '@/hooks'

function getVariantStats(stats: Record<string, any> | undefined): StatData[] {
  return [
    {
      label: "Total Attributes",
      value: stats?.total || 0,
      icon: Palette,
      variant: "primary",
      description: "All variant attributes",
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
      label: "Total Values",
      value: stats?.totalValues || 0,
      icon: Hash,
      variant: "info",
      description: "Across all attributes",
    },
  ]
}

// Column definitions
const columns: ColumnDef<VariantAttribute>[] = [
  {
    accessorKey: "name",
    header: "Attribute Name"
  },
  {
    accessorKey: "values",
    header: "Values",
    cell: ({ row }) => {
      const values = sanitize(row.getValue("values"), 'array') as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {values.slice(0, 3).map((value, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {value}
            </Badge>
          ))}
          {values.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{values.length - 3} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status") as string}
      </Badge>
    ),
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

const searchConfig = {
  globalSearch: true,
  placeholder: "Search attributes by name...",
}

export default function VariantsPage() {
  const [viewMode, setViewMode] = useViewMode('variants', 'card')
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Variant Management"
        subTitle="Manage your product variants and their details."
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
          columns={columns}
          selectable={true}
          searchConfig={searchConfig}
          operations={sharedOperations}
          enableSorting={true}
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
          pageSizes={[12, 24, 48]}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "md",
          }}
          searchConfig={searchConfig}
          renderCard={VariantCardView}
          loadingRenderCard={VariantCardLoading}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}