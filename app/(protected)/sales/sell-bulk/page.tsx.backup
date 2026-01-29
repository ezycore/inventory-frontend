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
import { Pencil, Trash2, Trash, ShoppingCart } from 'lucide-react'
import { useSalesStore, SaleItem } from '@/stores/sales-store'
import { useBulkSellStock } from '@/hooks/queries'
import { toast } from 'sonner'
import type { LabelValueOption } from '@/ui/components/advanced-select'

const saleSchema = z.object({
  locationId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  productId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]),
  variantId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]).optional(),
  soldQuantity: z.number().min(1, 'Quantity must be at least 1'),
})

type SaleFormData = z.infer<typeof saleSchema>

export default function BulkSellStockPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { items, addItem, updateItem, removeItem, clearAll } = useSalesStore()
  const bulkSellMutation = useBulkSellStock()

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      locationId: '',
      productId: '',
      variantId: '',
      soldQuantity: 1,
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
        title: 'Sale Details',
        icon: <ShoppingCart className="h-5 w-5 text-primary" />,
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
            name: 'soldQuantity',
            label: 'Sold Quantity',
            type: 'number',
            required: true,
            placeholder: 'Enter quantity sold',
            columnSpan: 3,
            validation: { min: 1 },
          },
        ],
      },
    ],
  }

  const handleAddOrUpdate = (data: SaleFormData) => {
    if (editingId) {
      // Update existing item
      updateItem(editingId, {
        productId: extractValue(data.productId),
        variantId: extractValue(data.variantId) || null,
        locationId: extractValue(data.locationId),
        soldQuantity: data.soldQuantity,
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
        soldQuantity: data.soldQuantity,
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
      soldQuantity: 1,
    })
  }

  const handleEdit = (item: SaleItem) => {
    setEditingId(item.id)
    form.setValue('locationId', { label: item.location_name, value: item.locationId })
    form.setValue('productId', { label: item.product_name, value: item.productId })
    form.setValue('variantId', item.variantId ? { 
      label: item.variant_attributes?.name || item.variantId, 
      value: item.variantId 
    } : '')
    form.setValue('soldQuantity', item.soldQuantity)
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

    const sales = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      locationId: item.locationId,
      soldQuantity: item.soldQuantity,
    }))

    try {
      await bulkSellMutation.mutateAsync(sales)
      // Transaction succeeded - clear Zustand store
      clearAll()
      form.reset()
    } catch (error) {
      // Transaction failed/rolled back - keep items in store for retry
      console.error('Bulk sell failed:', error)
      // Items remain in Zustand store for user to review and retry
    }
  }

  const columns: ColumnDef<SaleItem>[] = [
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
      accessorKey: 'soldQuantity',
      header: 'Sold Quantity',
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
        <h1 className="text-3xl font-bold">Sell Stock (Bulk)</h1>
        <p className="text-muted-foreground">
          Record multiple stock sales at once
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
          title={`Items to Sell (${items.length})`}
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
          emptyMessage="No items to sell"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkSellMutation.isPending,
              disabled: bulkSellMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Sell Stock?',
              confirmationDescription: `This will record stock sale for ${items.length} item(s). This action cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
