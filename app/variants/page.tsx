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
import { DataTableCrud } from '@/ui/components/dataTable/crud'
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

// Column definitions
const columns: ColumnDef<VariantAttribute>[] = [
  {
    accessorKey: "name",
    header: "Attribute Name",
    cell: ({ row }) => (
      <AvatarCell
        name={row.getValue("name")}
        fallbackIcon={Tag}
        showActiveStatus={true}
        isActive={row.original.status === "active"}
      />
    ),
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

// Form configuration
const variantAttributeFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Attribute Name",
      placeholder: "Enter attribute name (e.g., Color, Size, Material)",
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 2,
        maxLength: 50,
      },
    },
    {
      name: "values",
      type: "textarea",
      label: "Attribute Values",
      placeholder: "Enter values separated by commas (e.g., Red, Blue, Green)",
      required: true,
      rows: 3,
      columnSpan: 12,
      helperText: "Separate multiple values with commas",
      validation: {
        minLength: 1,
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

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
      <div>
        <h1 className="text-3xl font-bold">Variant Attributes</h1>
        <p className="text-muted-foreground mt-1">
          Manage product variant attributes like Color, Size, Material, etc.
        </p>
      </div>

      {/* Variant Attributes Table with Integrated CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>All Variant Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableCrud<VariantAttribute>
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
              transformEditData: (item: VariantAttribute) => {
                // Transform values array to comma-separated string for editing
                return {
                  ...item,
                  values: Array.isArray(item.values) ? item.values.join(', ') : item.values
                };
              },
              prepareSubmitData: (data, isEdit, item) => {
                // Process the values string into an array
                const processedData = {
                  ...data,
                  values: typeof data.values === 'string' 
                    ? data.values.split(',').map((value: string) => value.trim()).filter((value: string) => value)
                    : data.values
                };

                if (isEdit && item) {
                  return { id: item._id, ...processedData };
                }
                return processedData;
              },
            }}
            enableSorting={true}
            defaultColumnVisibility={{ status: false }}
            enableRowHover={true}
            rowClassName={(row) =>
              row.status === "inactive" ? "bg-red-50 opacity-70" : ""
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}