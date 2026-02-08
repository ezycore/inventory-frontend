'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/ui/components/input'
import { Label } from '@/ui/components/label'
import { Textarea } from '@/ui/components/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select'
import DynamicForm from '@/ui/components/form'
import type { DynamicFormConfig } from '@/ui/components/form/type'
import { CardTable } from '@/ui/components/custom/card-table'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, Trash, ShoppingCart, Receipt } from 'lucide-react'
import { useSalesOrderStore, SalesOrderItem } from '@/services/stores/sales-order-store'
import { useCreateSalesOrder, useFulfillSalesOrder, useCustomerDiscount } from '@/services/api'
import { toast } from 'sonner'
import type { LabelValueOption } from '@/ui/components/advanced-select'
import { AdvancedSelect } from '@/ui/components/advanced-select'
import { Separator } from '@/ui/components/separator'

const itemSchema = z.object({
  productId: z.union([z.string().min(1, 'Product is required'), z.object({ label: z.string(), value: z.string() })]),
  variantId: z.union([z.string(), z.object({ label: z.string(), value: z.string() })]).optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discount: z.number().min(0).max(100),
})

type ItemFormData = z.infer<typeof itemSchema>

export default function SellBulkPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  
  const {
    customerId,
    customerName,
    customerDiscount,
    locationId,
    locationName,
    items,
    discountType,
    discountValue,
    notes,
    invoiceNumber,
    getSubtotal,
    getGrandTotal,
    setCustomer,
    setLocation,
    addItem,
    updateItem,
    removeItem,
    setOrderDiscount,
    setNotes,
    setInvoiceNumber,
    applyCustomerDiscountToAll,
    clearAll,
  } = useSalesOrderStore()

  const createOrderMutation = useCreateSalesOrder()
  const fulfillOrderMutation = useFulfillSalesOrder()
  
  // Fetch customer discount when customer changes
  const { data: discountData } = useCustomerDiscount(selectedCustomerId || undefined)

  // Update customer discount when data is fetched
  useEffect(() => {
    if (discountData?.data?.discount !== undefined) {
      setCustomer(customerId, customerName, discountData.data.discount)
    }
  }, [discountData])

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      productId: '',
      variantId: '',
      quantity: 1,
      unitPrice: 0,
      discount: customerDiscount,
    },
  })

  // Update default discount in form when customer changes
  useEffect(() => {
    if (!editingId) {
      form.setValue('discount', customerDiscount)
    }
  }, [customerDiscount, editingId])

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

  const itemFormConfig: DynamicFormConfig = {
    sections: [
      {
        title: 'Item Details',
        icon: <ShoppingCart className="h-5 w-5 text-primary" />,
        fields: [
          {
            name: 'productId',
            label: 'Product',
            type: 'select',
            required: true,
            optionsApi: '/inventory/sellable-products',
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
            name: 'quantity',
            label: 'Quantity',
            type: 'number',
            required: true,
            placeholder: 'Enter quantity',
            columnSpan: 2,
            validation: { min: 1 },
          },
          {
            name: 'unitPrice',
            label: 'Unit Price',
            type: 'number',
            required: true,
            placeholder: 'Enter price',
            columnSpan: 2,
            validation: { min: 0 },
          },
          {
            name: 'discount',
            label: 'Discount %',
            type: 'number',
            required: false,
            placeholder: '0',
            columnSpan: 2,
            validation: { min: 0, max: 100 },
          },
        ],
      },
    ],
  }

  const handleCustomerChange = (value: LabelValueOption | string | undefined) => {
    const id = extractValue(value)
    const name = extractLabel(value)
    setCustomer(id || null, name || null, 0)
    setSelectedCustomerId(id || null)
  }

  const handleLocationChange = (value: LabelValueOption | string | undefined) => {
    const id = extractValue(value)
    const name = extractLabel(value)
    setLocation(id || null, name || null)
  }

  const handleAddOrUpdate = (data: ItemFormData) => {
    const productId = extractValue(data.productId)
    const variantId = extractValue(data.variantId) || null
    const productName = extractLabel(data.productId)
    const variantName = data.variantId ? extractLabel(data.variantId) : null

    if (editingId) {
      updateItem(editingId, {
        productId,
        variantId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discount: data.discount || 0,
        productName,
        variantName,
      })
      setEditingId(null)
      toast.success('Item updated')
    } else {
      addItem({
        productId,
        variantId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discount: data.discount || customerDiscount,
        productName,
        variantName,
      })
      toast.success('Item added to order')
    }

    form.reset({
      productId: '',
      variantId: '',
      quantity: 1,
      unitPrice: 0,
      discount: customerDiscount,
    })
  }

  const handleEdit = (item: SalesOrderItem) => {
    setEditingId(item.id)
    form.setValue('productId', { label: item.productName, value: item.productId })
    form.setValue('variantId', item.variantId 
      ? { label: item.variantName || item.variantId, value: item.variantId }
      : '')
    form.setValue('quantity', item.quantity)
    form.setValue('unitPrice', item.unitPrice)
    form.setValue('discount', item.discount)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    form.reset({
      productId: '',
      variantId: '',
      quantity: 1,
      unitPrice: 0,
      discount: customerDiscount,
    })
  }

  const handleCreateAndFulfill = async () => {
    if (!locationId) {
      toast.error('Please select a location')
      return
    }
    if (items.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    try {
      // Create the sales order
      const orderData = {
        customerId: customerId || undefined,
        locationId,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          productName: item.productName,
          variantName: item.variantName,
        })),
        discountType,
        discountValue,
        notes: notes || undefined,
        invoiceNumber: invoiceNumber || undefined,
        status: 'draft' as const,
      }

      const createResult = await createOrderMutation.mutateAsync(orderData)
      
      if (createResult.data?._id) {
        // Immediately fulfill the order
        await fulfillOrderMutation.mutateAsync({ 
          id: createResult.data._id,
          data: { notes: 'Fulfilled via bulk sell' }
        })
        
        toast.success('Sale completed successfully!')
        clearAll()
        form.reset()
      }
    } catch (error) {
      console.error('Failed to complete sale:', error)
    }
  }

  const handleSaveDraft = async () => {
    if (!locationId) {
      toast.error('Please select a location')
      return
    }
    if (items.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    try {
      const orderData = {
        customerId: customerId || undefined,
        locationId,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          productName: item.productName,
          variantName: item.variantName,
        })),
        discountType,
        discountValue,
        notes: notes || undefined,
        invoiceNumber: invoiceNumber || undefined,
        status: 'draft' as const,
      }

      await createOrderMutation.mutateAsync(orderData)
      toast.success('Order saved as draft')
      clearAll()
      form.reset()
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`

  const columns: ColumnDef<SalesOrderItem>[] = [
    {
      accessorKey: 'productName',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.productName}</div>
          {row.original.variantName && (
            <div className="text-sm text-muted-foreground">{row.original.variantName}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => row.original.quantity,
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) => formatCurrency(row.original.unitPrice),
    },
    {
      accessorKey: 'discount',
      header: 'Discount',
      cell: ({ row }) => `${row.original.discount}%`,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.total),
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
        <h1 className="text-3xl font-bold">Sell Stock</h1>
        <p className="text-muted-foreground">
          Create a sales order and record stock sale
        </p>
      </div>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer */}
            <div>
              <Label>Customer (Optional)</Label>
              <AdvancedSelect
                value={customerId ? { value: customerId, label: customerName || '' } : undefined}
                onValueChange={(val) => handleCustomerChange(val as LabelValueOption)}
                optionsApi="/customers"
                placeholder="Select customer"
                labelInValue
              />
              {customerDiscount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Customer discount: {customerDiscount}%
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0 ml-2"
                    onClick={applyCustomerDiscountToAll}
                  >
                    Apply to all items
                  </Button>
                </p>
              )}
            </div>

            {/* Order Discount */}
            <div>
              <Label>Order Discount</Label>
              <div className="flex gap-2">
                <Select
                  value={discountType}
                  onValueChange={(value: 'percentage' | 'fixed') => setOrderDiscount(value, discountValue)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setOrderDiscount(discountType, Number(e.target.value))}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this order"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Item' : 'Add Item'}</CardTitle>
          <CardDescription>
            {editingId
              ? 'Update the item details below'
              : 'Add items to your sales order'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            config={itemFormConfig}
            onSubmit={handleAddOrUpdate}
            form={form}
            submitLabel={editingId ? 'Update Item' : 'Add to Order'}
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

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Order Items ({items.length})</CardTitle>
              <CardDescription>Review items before submitting</CardDescription>
            </div>
            <Button 
              variant="destructive" 
              size="icon"
              onClick={clearAll}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <CardTable
              columns={columns}
              data={items}
              emptyMessage="No items added"
              showCard={false}
            />

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Order Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})
                  </span>
                  <span>
                    -{formatCurrency(
                      discountType === 'percentage'
                        ? getSubtotal() * discountValue / 100
                        : discountValue
                    )}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>{formatCurrency(getGrandTotal())}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateAndFulfill}
                disabled={createOrderMutation.isPending || fulfillOrderMutation.isPending || !locationId}
                className="flex-1"
              >
                {(createOrderMutation.isPending || fulfillOrderMutation.isPending) 
                  ? 'Processing...' 
                  : 'Complete Sale'}
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createOrderMutation.isPending || !locationId}
              >
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
