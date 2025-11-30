'use client'

import { useState } from 'react'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { StatusBadge } from '@ui/components/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import DynamicForm from '@/ui/components/form'
import { useDynamicForm } from '@/hooks/use-dynamic-form'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, AlertTriangle, Download, Upload, RotateCcw } from 'lucide-react'
import type { DynamicFormConfig } from '@/types/form'
import { DataTableCrud } from '@/ui/components/dataTable/crud'
import { ColumnDef } from '@tanstack/react-table'
import { DateCell } from '@/ui/components/dataTable/cells/date-cell'
import { AvatarCell } from '@/ui/components/dataTable/cells/avatar-cell'

// Mock data for variant attributes (replace with actual API calls)
const mockVariantAttributes = [
  {
    _id: '1',
    name: 'Size',
    values: ['XS', 'S', 'M', 'L', 'XL'],
    status: 'active',
    created_at: '2024-12-24T00:00:00Z'
  },
  {
    _id: '2',
    name: 'Color',
    values: ['Red', 'Blue', 'Green'],
    status: 'active',
    created_at: '2024-12-10T00:00:00Z'
  },
  {
    _id: '3',
    name: 'Capacity',
    values: ['Small', 'Medium', 'Large'],
    status: 'active',
    created_at: '2024-11-27T00:00:00Z'
  },
  {
    _id: '4',
    name: 'Material',
    values: ['Cotton', 'Leather', 'Synthetic'],
    status: 'active',
    created_at: '2024-11-18T00:00:00Z'
  },
  {
    _id: '5',
    name: 'Weight',
    values: ['Light', 'Heavy'],
    status: 'active',
    created_at: '2024-11-06T00:00:00Z'
  },
  {
    _id: '6',
    name: 'Style',
    values: ['Casual', 'Formal', 'Sporty'],
    status: 'active',
    created_at: '2024-10-25T00:00:00Z'
  },
  {
    _id: '7',
    name: 'Pattern',
    values: ['Solid', 'Striped', 'Printed'],
    status: 'active',
    created_at: '2024-10-14T00:00:00Z'
  },
  {
    _id: '8',
    name: 'Memory',
    values: ['8 GB', '16 GB', '36 GB'],
    status: 'active',
    created_at: '2024-10-03T00:00:00Z'
  },
  {
    _id: '9',
    name: 'Storage',
    values: ['128 GB', '256 GB', '512 GB', '1TB'],
    status: 'active',
    created_at: '2024-09-20T00:00:00Z'
  },
  {
    _id: '10',
    name: 'Length',
    values: ['Short', 'Regular', 'Long'],
    status: 'active',
    created_at: '2024-09-10T00:00:00Z'
  }
]

const variantAttributeFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: 'name',
      type: 'input',
      label: 'Variant Attribute Name',
      placeholder: 'Enter attribute name (e.g., Color, Size)',
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'values',
      type: 'textarea',
      label: 'Attribute Values',
      placeholder: 'Enter values separated by commas (e.g., Red, Blue, Green)',
      required: true,
      rows: 3,
      columnSpan: 12,
      helperText: 'Separate multiple values with commas',
      validation: {
        minLength: 3,
        maxLength: 500
      }
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      columnSpan: 12,
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ]
}

export default function VariantsPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Use all mock data since DataTableCrud handles filtering
  const filteredAttributes = mockVariantAttributes

  const handleFormSubmit = async (data: any) => {
    // Process the values string into an array
    const processedData = {
      ...data,
      values: data.values.split(',').map((value: string) => value.trim()).filter((value: string) => value)
    }
    
    if (editingAttribute) {
      return { id: editingAttribute._id, ...processedData }
    }
    return processedData
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Define columns for DataTable with proper typing
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Variant Name',
      cell: ({ row }) => (
        <AvatarCell
          name={row.getValue("name")}
          fallbackIcon={AlertTriangle}
          showActiveStatus={true}
          isActive={row.original.status === "active"}
        />
      ),
    },
    {
      accessorKey: 'values',
      header: 'Values',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(row.original.values as string[]).join(', ')}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created Date',
      cell: ({ row }) => <DateCell value={row.getValue("created_at")} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Variant Attributes</h1>
          <p className="text-muted-foreground">
            Manage your variant attributes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Variant Attributes Table with Integrated CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>All Variant Attributes ({filteredAttributes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableCrud
            columns={columns}
            data={filteredAttributes}
            selectable={true}
            searchConfig={{
              globalSearch: true,
              placeholder: "Search variant attributes by name, values, or status...",
            }}
            crud={{
              formConfig: variantAttributeFormConfig,
              entityName: "Variant Attribute",
              defaultValues: {
                name: "",
                values: "",
                status: "active" as const,
              },
              prepareSubmitData: (data, isEdit, item) => ({
                ...handleFormSubmit(data),
                ...(isEdit && item ? { id: item._id } : {}),
              }),
            }}
            enableSorting={true}
            defaultColumnVisibility={{ status: false }}
            enableRowHover={true}
            isLoading={isLoading}
            rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          />
        </CardContent>
      </Card>
    </div>
  )
}