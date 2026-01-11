'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card'
import DynamicForm from '@/ui/components/form'
import type { DynamicFormConfig } from '@/ui/components/form/type'
import { CardTable } from '@/ui/components/custom/card-table'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, Trash, CornerUpLeft } from 'lucide-react'
import { useSalesReturnStore, SalesReturnItem } from '@/stores/sales-return-store'
import { useBulkReturnSale } from '@/hooks/queries'
import { toast } from 'sonner'
import type { LabelValueOption } from '@/ui/components/advanced-select'

const returnSchema = z.object({
  locationId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  productId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  variantId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]).optional(),
  returnedQuantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
})

type ReturnFormData = z.infer<typeof returnSchema>

export default function BulkSalesReturnPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { items, addItem, updateItem, removeItem, clearAll } = useSalesReturnStore()
  const bulkReturnMutation = useBulkReturnSale()

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      locationId: '',
      productId: '',
      variantId: '',
      returnedQuantity: 1,
      notes: '',
    },
  })

  // Helper to extract value from labelInValue format
  const extractValue = (val: string | LabelValueOption | undefined): string => {
    if (!val) return ''
    return typeof val === 'object' ? val.value : val
  }

  // Helper to extract label from labelInValue format
  const extractLabel = (val: string | LabelValueOption | undefined): string => {
    if (!val) return ''
    return typeof val === 'object' ? val.label : val
  }

  const formConfig: DynamicFormConfig = {
    sections: [
      {
        title: 'Sales Return Details',
        icon: <CornerUpLeft className="h-5 w-5 text-primary" />,
        fields: [
          {
            name: 'locationId',
            label: 'Location',
            type: 'select',
            required: true,
            optionsApi: '/locations',
            placeholder: 'Select location',
            labelInValue: true,
            columnSpan: 3,
          },
          {
            name: 'productId',
            label: 'Product',
            type: 'select',
            required: true,
            optionsApi: '/products',
            placeholder: 'Select product',
            labelInValue: true,
            columnSpan: 3,
          },
          {
            name: 'variantId',
            label: 'Variant',
            type: 'select',
            required: false,
            dependsOn: 'productId',
            dependsOnTemplate: '/products/:id/variants',
            placeholder: 'Select variant (optional)',
            labelInValue: true,
            columnSpan: 3,
          },
          {
            name: 'returnedQuantity',
            label: 'Returned Quantity',
            type: 'number',
            required: true,
            placeholder: 'Enter quantity returned',
            columnSpan: 3,
            validation: { min: 1 },
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            required: false,
            placeholder: 'Reason for return (optional)',
            columnSpan: 4,
          },
        ],
      },
    ],
  }

  const handleAddOrUpdate = (data: ReturnFormData) => {
    if (editingId) {
      // Update existing item
      updateItem(editingId, {
        productId: extractValue(data.productId),
        variantId: extractValue(data.variantId) || null,
        locationId: extractValue(data.locationId),
        returnedQuantity: data.returnedQuantity,
        product_name: extractLabel(data.productId),
        location_name: extractLabel(data.locationId),
        variant_attributes: data.variantId ? { name: extractLabel(data.variantId) } : null,
        notes: data.notes,
      })
      setEditingId(null)
      toast.success('Item updated in list')
    } else {
      const productId = extractValue(data.productId)
      const locationId = extractValue(data.locationId)
      const variantId = extractValue(data.variantId) || null

      // Check if item already exists
      const existingItem = items.find(
        (item) =>
          item.productId === productId &&
          item.locationId === locationId &&
          (item.variantId || null) === variantId
      )

      // Add new item (replaces existing if duplicate)
      addItem({
        productId: productId,
        variantId: variantId,
        locationId: locationId,
        returnedQuantity: data.returnedQuantity,
        product_name: extractLabel(data.productId),
        location_name: extractLabel(data.locationId),
        variant_attributes: data.variantId ? { name: extractLabel(data.variantId) } : null,
        notes: data.notes,
      })
      
      if (existingItem) {
        toast.success('Item updated in list (replaced duplicate)')
      } else {
        toast.success('Item added to list')
      }
    }
  
    form.reset({
      locationId: data.locationId,
      productId: '',
      variantId: '',
      returnedQuantity: 1,
      notes: '',
    })
  }

  const handleEdit = (item: SalesReturnItem) => {
    setEditingId(item.id)
    form.setValue('locationId', { label: item.location_name, value: item.locationId })
    form.setValue('productId', { label: item.product_name, value: item.productId })
    form.setValue('variantId', item.variantId ? { 
      label: item.variant_attributes?.name || item.variantId, 
      value: item.variantId 
    } : '')
    form.setValue('returnedQuantity', item.returnedQuantity)
    form.setValue('notes', item.notes || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    form.reset()
  }

  const handleSubmitAll = async () => {
    if (items.length === 0) {
      toast.error('No items to submit')
      return
    }

    const returns = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      locationId: item.locationId,
      returnedQuantity: item.returnedQuantity,
      notes: item.notes,
    }))

    try {
      await bulkReturnMutation.mutateAsync(returns)
      // Transaction succeeded - clear Zustand store
      clearAll()
      form.reset()
    } catch (error) {
      // Transaction failed/rolled back - keep items in store for retry
      console.error('Bulk sales return failed:', error)
      // Items remain in Zustand store for user to review and retry
    }
  }

  const columns: ColumnDef<SalesReturnItem>[] = [
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => row.original.product_name || row.original.productId,
    },
    {
      accessorKey: 'variant_attributes',
      header: 'Variant',
      cell: ({ row }) => {
        const attrs = row.original.variant_attributes
        if (!attrs) return '-'
        if (attrs.name) return attrs.name
        return Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')
      },
    },
    {
      accessorKey: 'location_name',
      header: 'Location',
      cell: ({ row }) => row.original.location_name || row.original.locationId,
    },
    {
      accessorKey: 'returnedQuantity',
      header: 'Returned Quantity',
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => row.original.notes || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            disabled={editingId === row.original.id}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Returns (Bulk)</h1>
        <p className="text-muted-foreground">
          Process multiple customer returns at once (Stock IN)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Return' : 'Add Return'}</CardTitle>
          <CardDescription>
            {editingId
              ? 'Update the return details below'
              : 'Add items to the list and submit all at once'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            config={formConfig}
            onSubmit={handleAddOrUpdate}
            form={form}
            submitLabel={editingId ? 'Update Item' : 'Add to List'}
          />
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              className="mt-4"
            >
              Cancel Edit
            </Button>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <CardTable
          title={`Returns to Process (${items.length})`}
          description="Review and edit returns before submitting"
          headerAction={
            <Button 
              variant="destructive" 
              size="icon"
              onClick={clearAll}
            >
              <Trash className="h-4 w-4" />
            </Button>
          }
          columns={columns}
          data={items}
          emptyMessage="No returns to process"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkReturnMutation.isPending,
              disabled: bulkReturnMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Process Sales Returns?',
              confirmationDescription: `This will process ${items.length} sales return(s) and increase stock. This action cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
