'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'

// Types
import type { VariantAttribute } from '@/types'

// UI Components
import { Badge } from '@ui/components/badge'
import { DateCell } from '@/ui/components/dataTable/cells/date-cell'

// Hooks & API
import {
  useCreateVariantAttribute,
  useUpdateVariantAttribute,
  useDeleteVariantAttribute,
} from '@/services/api'
import { variantAttributesApi } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'
import variantAttributeFormConfig from '@/components/variants/form-config'
import { DataTable } from '@/ui/components/dataTable'
import PageHeader from '@/ui/components/header'
import { sanitize } from '@/hooks'

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

export default function VariantsPage() {
  const createVariantAttribute = useCreateVariantAttribute();
  const updateVariantAttribute = useUpdateVariantAttribute();
  const deleteVariantAttribute = useDeleteVariantAttribute();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Variant Management" subTitle="Manage your product variants and their details." />


      <DataTable<VariantAttribute>
        cardTitle={(dataLength: number) => `All Variants (${dataLength})`}
        columns={columns}
        selectable={true}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search attributes by name...",
        }}
        operations={{
          getAllData: variantAttributesApi.getAll,
          formConfig: variantAttributeFormConfig,
          createMutation: createVariantAttribute,
          updateMutation: updateVariantAttribute,
          deleteMutation: deleteVariantAttribute,
          entityName: "Variant Attribute",
          queryKey: [...queryKeys.variantAttributes.all()],
          transformEditData: variantAttributesApi.transformForEdit
        }}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        rowClassName={(row) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
      />
    </div>
  );
}