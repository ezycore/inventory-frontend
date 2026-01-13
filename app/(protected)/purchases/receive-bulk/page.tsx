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
import { Pencil, Trash2, Trash, Package } from 'lucide-react'
import { usePurchaseReceiveStore, ReceiveItem } from '@/stores/purchase-receive-store'
import { useBulkReceiveStock } from '@/hooks/queries'
import { toast } from 'sonner'
import type { LabelValueOption } from '@/ui/components/advanced-select'

const receiveSchema = z.object({
  locationId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  productId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  variantId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]).optional(),
  receivedQuantity: z.number().min(1, 'Quantity must be at least 1'),
})

type ReceiveFormData = z.infer<typeof receiveSchema>

export default function BulkReceiveStockPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { items, addItem, updateItem, removeItem, clearAll } = usePurchaseReceiveStore()
  const bulkReceiveMutation = useBulkReceiveStock()

  const form = useForm<ReceiveFormData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      locationId: '',
      productId: '',
      variantId: '',
      receivedQuantity: 1,
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
        title: 'Receive Stock Details',
        icon: <Package className="h-5 w-5 text-primary" />,
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
            name: 'receivedQuantity',
            label: 'Received Quantity',
            type: 'number',
            required: true,
            placeholder: 'Enter quantity received',
            columnSpan: 3,
            validation: { min: 1 },
          },
        ],
      },
    ],
  }

  const handleAddOrUpdate = (data: ReceiveFormData) => {
    if (editingId) {
      // Update existing item
      updateItem(editingId, {
        productId: extractValue(data.productId),
        variantId: extractValue(data.variantId) || null,
        locationId: extractValue(data.locationId),
        receivedQuantity: data.receivedQuantity,
        product_name: extractLabel(data.productId),
        location_name: extractLabel(data.locationId),
        variant_attributes: data.variantId ? { name: extractLabel(data.variantId) } : null,
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
        receivedQuantity: data.receivedQuantity,
        product_name: extractLabel(data.productId),
        location_name: extractLabel(data.locationId),
        variant_attributes: data.variantId ? { name: extractLabel(data.variantId) } : null,
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
      receivedQuantity: 1,
    })
  }

  const handleEdit = (item: ReceiveItem) => {
    setEditingId(item.id)
    form.setValue('locationId', { label: item.location_name, value: item.locationId })
    form.setValue('productId', { label: item.product_name, value: item.productId })
    form.setValue('variantId', item.variantId ? { 
      label: item.variant_attributes?.name || item.variantId, 
      value: item.variantId 
    } : '')
    form.setValue('receivedQuantity', item.receivedQuantity)
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

    const receipts = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      locationId: item.locationId,
      receivedQuantity: item.receivedQuantity,
    }))

    try {
      await bulkReceiveMutation.mutateAsync(receipts)
      // Transaction succeeded - clear Zustand store
      clearAll()
      form.reset()
    } catch (error) {
      // Transaction failed/rolled back - keep items in store for retry
      console.error('Bulk receive failed:', error)
      // Items remain in Zustand store for user to review and retry
    }
  }

  const columns: ColumnDef<ReceiveItem>[] = [
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
      accessorKey: 'receivedQuantity',
      header: 'Received Quantity',
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
        <h1 className="text-3xl font-bold">Receive Stock (Bulk)</h1>
        <p className="text-muted-foreground">
          Receive multiple stock items at once
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Item' : 'Add Item'}</CardTitle>
          <CardDescription>
            {editingId
              ? 'Update the item details below'
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
          title={`Items to Receive (${items.length})`}
          description="Review and edit items before submitting"
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
          emptyMessage="No items to receive"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkReceiveMutation.isPending,
              disabled: bulkReceiveMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Receive Stock?',
              confirmationDescription: `This will receive stock for ${items.length} item(s). This action cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
