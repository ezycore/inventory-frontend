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
import { Pencil, Trash2, Trash, ArrowRightLeft } from 'lucide-react'
import { useTransferStore, TransferItem } from '@/services/stores/stock-transfer-store'
import { useBulkTransferStock } from '@/services/api'
import { toast } from 'sonner'
import type { LabelValueOption } from '@/ui/components/advanced-select'

const transferSchema = z.object({
  fromLocationId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  toLocationId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  productId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  variantId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]).optional(),
  transferQuantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
})

type TransferFormData = z.infer<typeof transferSchema>

export default function BulkStockTransferPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { items, addItem, updateItem, removeItem, clearAll } = useTransferStore()
  const bulkTransferMutation = useBulkTransferStock()

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromLocationId: '',
      toLocationId: '',
      productId: '',
      variantId: '',
      transferQuantity: 1,
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
        title: 'Stock Transfer Details',
        icon: <ArrowRightLeft className="h-5 w-5 text-primary" />,
        fields: [
          {
            name: 'fromLocationId',
            label: 'From Location',
            type: 'select',
            required: true,
            optionsApi: '/locations',
            placeholder: 'Select source location',
            labelInValue: true,
            columnSpan: 2,
          },
          {
            name: 'toLocationId',
            label: 'To Location',
            type: 'select',
            required: true,
            optionsApi: '/locations',
            placeholder: 'Select destination location',
            labelInValue: true,
            columnSpan: 2,
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
            optionsApi: '/products/{{productId}}/variants',
            dependsOn: {
              field: 'productId',
              condition: 'truthy',
              action: 'disable',
            },
            placeholder: 'Select variant (optional)',
            labelInValue: true,
            columnSpan: 3,
          },
          {
            name: 'transferQuantity',
            label: 'Transfer Quantity',
            type: 'number',
            required: true,
            placeholder: 'Enter quantity to transfer',
            columnSpan: 2,
            validation: { min: 1 },
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            required: false,
            placeholder: 'Reason for transfer (optional)',
            columnSpan: 4,
          },
        ],
      },
    ],
  }

  const handleAddOrUpdate = (data: TransferFormData) => {
    const fromLocationId = extractValue(data.fromLocationId)
    const toLocationId = extractValue(data.toLocationId)

    // Validate same location
    if (fromLocationId === toLocationId) {
      toast.error('Cannot transfer to the same location')
      return
    }

    if (editingId) {
      // Update existing item
      updateItem(editingId, {
        productId: extractValue(data.productId),
        variantId: extractValue(data.variantId) || null,
        fromLocationId: fromLocationId,
        toLocationId: toLocationId,
        transferQuantity: data.transferQuantity,
        product_name: extractLabel(data.productId),
        from_location_name: extractLabel(data.fromLocationId),
        to_location_name: extractLabel(data.toLocationId),
        variant_attributes: data.variantId ? { name: extractLabel(data.variantId) } : null,
        notes: data.notes,
      })
      setEditingId(null)
      toast.success('Item updated in list')
    } else {
      const productId = extractValue(data.productId)
      const variantId = extractValue(data.variantId) || null

      // Check if item already exists
      const existingItem = items.find(
        (item) =>
          item.productId === productId &&
          item.fromLocationId === fromLocationId &&
          item.toLocationId === toLocationId &&
          (item.variantId || null) === variantId
      )

      // Add new item (replaces existing if duplicate)
      addItem({
        productId: productId,
        variantId: variantId,
        fromLocationId: fromLocationId,
        toLocationId: toLocationId,
        transferQuantity: data.transferQuantity,
        product_name: extractLabel(data.productId),
        from_location_name: extractLabel(data.fromLocationId),
        to_location_name: extractLabel(data.toLocationId),
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
      fromLocationId: data.fromLocationId,
      toLocationId: data.toLocationId,
      productId: '',
      variantId: '',
      transferQuantity: 1,
      notes: '',
    })
  }

  const handleEdit = (item: TransferItem) => {
    setEditingId(item.id)
    form.setValue('fromLocationId', { label: item.from_location_name, value: item.fromLocationId })
    form.setValue('toLocationId', { label: item.to_location_name, value: item.toLocationId })
    form.setValue('productId', { label: item.product_name, value: item.productId })
    form.setValue('variantId', item.variantId ? { 
      label: item.variant_attributes?.name || item.variantId, 
      value: item.variantId 
    } : '')
    form.setValue('transferQuantity', item.transferQuantity)
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

    const transfers = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      fromLocationId: item.fromLocationId,
      toLocationId: item.toLocationId,
      transferQuantity: item.transferQuantity,
      notes: item.notes,
    }))

    try {
      await bulkTransferMutation.mutateAsync(transfers)
      // Transaction succeeded - clear Zustand store
      clearAll()
      form.reset()
    } catch (error) {
      // Transaction failed/rolled back - keep items in store for retry
      console.error('Bulk transfer failed:', error)
      // Items remain in Zustand store for user to review and retry
    }
  }

  const columns: ColumnDef<TransferItem>[] = [
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
      accessorKey: 'from_location_name',
      header: 'From',
      cell: ({ row }) => row.original.from_location_name || row.original.fromLocationId,
    },
    {
      accessorKey: 'to_location_name',
      header: 'To',
      cell: ({ row }) => row.original.to_location_name || row.original.toLocationId,
    },
    {
      accessorKey: 'transferQuantity',
      header: 'Quantity',
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
        <h1 className="text-3xl font-bold">Stock Transfer (Bulk)</h1>
        <p className="text-muted-foreground">
          Transfer stock between locations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Transfer' : 'Add Transfer'}</CardTitle>
          <CardDescription>
            {editingId
              ? 'Update the transfer details below'
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
          title={`Transfers to Process (${items.length})`}
          description="Review and edit transfers before submitting"
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
          emptyMessage="No transfers to process"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkTransferMutation.isPending,
              disabled: bulkTransferMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Process Stock Transfers?',
              confirmationDescription: `This will transfer stock for ${items.length} item(s) between locations. This action cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
