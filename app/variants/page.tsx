'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Tag } from 'lucide-react'

// Types
import type { VariantAttribute } from '@/types'
import type { DynamicFormConfig } from '@/ui/components/form/type'
import type { FilterConfig } from '@/types/filter'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { DateCell } from '@/ui/components/dataTable/cells/date-cell'
import { AvatarCell } from '@/ui/components/dataTable/cells/avatar-cell'

// Hooks & API
import {
  useCreateVariantAttribute,
  useUpdateVariantAttribute,
  useDeleteVariantAttribute,
} from '@/hooks/queries'
import { variantAttributesApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys-products'
import variantAttributeFormConfig from '@/components/variants/form-config'
import { DataTable } from '@/ui/components/dataTable'
import PageHeader from '@/ui/components/header'

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
      const values = row.getValue("values") as string[];
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
    accessorKey: "created_at",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("created_at")} />,
  },
  {
    accessorKey: "updated_at",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updated_at")} />,
  },
];

// Filter configuration
const filterConfig: FilterConfig = {
  fields: [
    {
      name: "status",
      type: "select",
      label: "Status",
      placeholder: "All Status",
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

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

        apiConfig={{
          endpoint: variantAttributesApi,
          queryKey: [...queryKeys.variantAttributes.all()],
          defaultPageSize: 10,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        filterConfig={filterConfig}
        columns={columns}
        selectable={true}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search attributes by name...",
        }}
        crud={{
          formConfig: variantAttributeFormConfig,
          createMutation: createVariantAttribute,
          updateMutation: updateVariantAttribute,
          deleteMutation: deleteVariantAttribute,
          entityName: "Variant Attribute",
          queryKey: [...queryKeys.variantAttributes.all()],
          defaultValues: {
            name: "",
            values: "",
            status: "active" as const,
          },
          transformEditData: variantAttributesApi.transformForEdit,
          prepareSubmitData: (data, isEdit, item) => {
            // Add id for edit mode (processing is handled by API)
            if (isEdit && item) {
              return { id: item._id, ...data };
            }
            return data;
          },
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