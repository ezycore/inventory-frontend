'use client'

import { useCallback, useMemo, useState } from 'react'
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
import type { DynamicFormConfig, SelectOption, FormFieldConfig } from '@/ui/components/form/type'
import { CardTable } from '@/ui/components/custom/card-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ShoppingCart, Trash2, ChevronDown, ChevronUp, User } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/ui/components/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui/components/collapsible'
import {
  useSellPageStore,
  type CustomerSelectOption,
  type ProductSelectOption,
  type SellOrderItem,
  useAuthStore,
} from '@/services/stores'
import {
  type DiscountType,
  applyDiscountWithPriority,
} from '@/utils/discount'
import { useCreateSalesOrder, useFulfillSalesOrder } from '@/services/api'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/components/popover'

// =====================
// Schema Definitions
// =====================

const customerFormSchema = z.object({
  customerId: z.union([
    z.string(),
    z.object({
      label: z.string(),
      value: z.string(),
      defaultDiscountValue: z.number().optional(),
      defaultDiscountType: z.enum(['percentage', 'fixed']).optional(),
    }),
  ]).optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  accountId: z.union([
    z.string(),
    z.object({
      label: z.string(),
      value: z.string(),
      isDefault: z.boolean().optional(),
    }),
  ]).optional().nullable(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

const productFormSchema = z.object({
  productId: z.union([
    z.string().min(1, 'Product is required'),
    z.object({
      label: z.string(),
      value: z.string(),
      price: z.number().optional(),
      costPrice: z.number().optional(),
      availableQuantity: z.number().optional(),
      productDiscountType: z.enum(['percentage', 'fixed']).optional(),
      productDiscountValue: z.number().optional(),
    }),
  ]),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  costPrice: z.number().min(0),
  unitPrice: z.number().min(0),
  discountAmount: z.number().min(0),
  salePrice: z.number().min(0),
})

type CustomerFormData = z.infer<typeof customerFormSchema>
type ProductFormData = z.infer<typeof productFormSchema>

// =====================
// Types for API Responses
// =====================

interface CustomerApiItem {
  _id: string
  name: string
  defaultDiscount?: {
    value?: number
    type?: DiscountType
  }
}

interface ProductApiItem {
  _id: string
  name: string
  price: number
  costPrice: number
  quantity: number
  discountType?: DiscountType
  discountValue?: number
}

interface CustomerApiResponse {
  data?: {
    items?: CustomerApiItem[]
  }
}

interface ProductApiResponse {
  data?: ProductApiItem[]
}

interface AccountApiItem {
  _id: string
  name: string
  isDefault: boolean
  balance: number
}

interface AccountApiResponse {
  data?: {
    items?: AccountApiItem[]
  }
}

// =====================
// Transform Callbacks
// =====================

/**
 * Transform customer API response to select options with discount metadata
 */
const customerItemsCreateCallback = (response: CustomerApiResponse): SelectOption[] => {
  const items = response?.data?.items || []
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    defaultDiscountValue: item.defaultDiscount?.value ?? 0,
    defaultDiscountType: item.defaultDiscount?.type ?? 'fixed',
  })) as SelectOption[]
}

/**
 * Transform inventory API response to select options with pricing metadata
 */
const productItemsCreateCallback = (response: ProductApiResponse): SelectOption[] => {
  const items = response?.data || []
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    price: item.price,
    costPrice: item.costPrice,
    availableQuantity: item.quantity,
    productDiscountType: item.discountType ?? 'fixed',
    productDiscountValue: item.discountValue ?? 0,
  })) as SelectOption[]
}

/**
 * Transform accounts API response to select options
 */
const accountItemsCreateCallback = (response: AccountApiResponse): SelectOption[] => {
  const items = response?.data?.items || []
  return items.map((item) => ({
    value: item._id,
    label: `${item.name} (৳${item.balance.toFixed(2)})`,
    isDefault: item.isDefault,
  })) as SelectOption[]
}

// =====================
// Helper Functions
// =====================

interface ExtractedCustomer {
  value: string | null
  label: string | null
  discountType: DiscountType
  discountValue: number
}

const extractCustomerValue = (
  val: CustomerFormData['customerId']
): ExtractedCustomer => {
  if (!val) {
    return { value: null, label: null, discountType: 'percentage', discountValue: 0 }
  }
  if (typeof val === 'object' && 'value' in val) {
    return {
      value: val.value,
      label: val.label,
      discountType: (val.defaultDiscountType as DiscountType) ?? 'percentage',
      discountValue: val.defaultDiscountValue ?? 0,
    }
  }
  return { value: val as string, label: null, discountType: 'percentage', discountValue: 0 }
}

interface ExtractedProduct {
  value: string
  label: string
  price: number
  costPrice: number
  availableQuantity: number
  productDiscountType: DiscountType
  productDiscountValue: number
}

const extractProductValue = (
  val: ProductFormData['productId']
): ExtractedProduct | null => {
  if (!val) return null
  if (typeof val === 'object' && 'value' in val) {
    return {
      value: val.value,
      label: val.label,
      price: val.price ?? 0,
      costPrice: val.costPrice ?? 0,
      availableQuantity: val.availableQuantity ?? 0,
      productDiscountType: (val.productDiscountType as DiscountType) ?? 'fixed',
      productDiscountValue: val.productDiscountValue ?? 0,
    }
  }
  return null
}

const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`

// =====================
// Main Component
// =====================

export default function SalesPage() {
  const [isOrderOpen, setIsOrderOpen] = useState(true)
  const [showSuccessPopover, setShowSuccessPopover] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0)

  // Get organization features
  const { user } = useAuthStore()
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false

  // Store state
  const {
    customerId,
    customerName,
    orderDiscountType,
    orderDiscountValue,
    notes,
    items,
    getTotalCostPrice,
    getTotalSalePrice,
    setCustomer,
    setOrderDiscount,
    setNotes,
    addItem,
    removeItem,
    clearAll,
  } = useSellPageStore()

  // API mutations
  const createOrderMutation = useCreateSalesOrder()
  const fulfillOrderMutation = useFulfillSalesOrder()

  // Customer form
  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: customerId ? { value: customerId, label: customerName || '' } : null,
      discountType: orderDiscountType,
      discountValue: orderDiscountValue,
      accountId: null,
      paidAmount: 0,
      notes: notes,
    },
  })

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      costPrice: 0,
      unitPrice: 0,
      discountAmount: 0,
      salePrice: 0,
    },
  })

  // =====================
  // Form Configurations
  // =====================

  const customerFormConfig: DynamicFormConfig = useMemo(() => {
    const fields: FormFieldConfig[] = [
      {
        name: 'customerId',
        label: 'Customer',
        type: 'select',
        required: false,
        optionsApi: '/sales/customers',
        placeholder: 'Select customer (optional)',
        labelInValue: true,
        itemsCreateCallback: customerItemsCreateCallback,
        columnSpan: 6,
      },
      {
        name: 'discountType',
        label: 'Discount Type',
        type: 'select',
        required: true,
        options: [
          { value: 'percentage', label: 'Percentage (%)' },
          { value: 'fixed', label: 'Fixed Amount' },
        ],
        columnSpan: 3,
      },
      {
        name: 'discountValue',
        label: 'Discount Value',
        type: 'number',
        required: false,
        placeholder: '0',
        columnSpan: 3,
        validation: { min: 0 },
      },
    ]

    // Add account and payment fields if accounts feature is enabled
    if (isAccountsEnabled) {
      fields.push(
        {
          name: 'accountId',
          label: 'Payment Account',
          type: 'select',
          required: false,
          optionsApi: '/accounts',
          placeholder: 'Select account',
          labelInValue: true,
          itemsCreateCallback: accountItemsCreateCallback,
          columnSpan: 6,
        },
        {
          name: 'paidAmount',
          label: 'Paid Amount',
          type: 'number',
          required: false,
          placeholder: '0',
          columnSpan: 6,
          validation: { min: 0 },
        }
      )
    }

    fields.push({
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Add any notes for this sale (optional)',
      columnSpan: 12,
      rows: 2,
    })

    return {
      sections: [
        {
          title: 'Customer & Order Discount',
          icon: <User className="h-5 w-5 text-primary" />,
          fields,
        },
      ],
    }
  }, [isAccountsEnabled])

  const productFormConfig: DynamicFormConfig = useMemo(() => ({
    sections: [
      {
        title: 'Add Product',
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
            itemsCreateCallback: productItemsCreateCallback,
            columnSpan: 4,
          },
          {
            name: 'quantity',
            label: 'Quantity',
            type: 'number',
            required: true,
            placeholder: '1',
            columnSpan: 2,
            validation: { min: 1 },
          },
          {
            name: 'costPrice',
            label: 'Cost Price',
            type: 'number',
            required: false,
            disabled: true,
            columnSpan: 2,
          },
          {
            name: 'unitPrice',
            label: 'Unit Price',
            type: 'number',
            required: true,
            placeholder: '0',
            columnSpan: 2,
            validation: { min: 0 },
          },
          {
            name: 'discountAmount',
            label: 'Discount',
            type: 'number',
            required: false,
            disabled: true,
            columnSpan: 1,
          },
          {
            name: 'salePrice',
            label: 'Sale Price',
            type: 'number',
            required: false,
            disabled: true,
            columnSpan: 1,
          },
        ],
      },
    ],
  }), [])

  // =====================
  // Event Handlers
  // =====================

  /**
   * Handle customer field changes - auto-fill discount from customer
   */
  const handleCustomerFieldChange = useCallback((fieldName: string, value: unknown) => {
    if (fieldName === 'customerId') {
      const customer = extractCustomerValue(value as CustomerFormData['customerId'])
      
      // Update store
      setCustomer(
        customer.value,
        customer.label,
        customer.discountType,
        customer.discountValue
      )
      
      // Auto-fill discount fields when customer is selected
      if (customer.value) {
        customerForm.setValue('discountType', customer.discountType)
        customerForm.setValue('discountValue', customer.discountValue)
      }
    } else if (fieldName === 'discountType') {
      // Read current discount value directly from form
      const currentDiscountValue = customerForm.getValues('discountValue')
      setOrderDiscount(value as DiscountType, currentDiscountValue)
    } else if (fieldName === 'discountValue') {
      // Read current discount type directly from form
      const currentDiscountType = customerForm.getValues('discountType')
      setOrderDiscount(currentDiscountType, value as number)
    } else if (fieldName === 'paidAmount') {
      // Update local state for reactive display
      setPaidAmount(value as number)
    } else if (fieldName === 'notes') {
      setNotes(value as string)
    }
  }, [customerForm, setCustomer, setOrderDiscount, setNotes])

  /**
   * Handle product field changes - calculate prices and discounts
   */
  const handleProductFieldChange = useCallback((fieldName: string, value: unknown) => {
    if (fieldName === 'productId') {
      const product = extractProductValue(value as ProductFormData['productId'])
      
      if (product) {
        // Read current discount values directly from form (not from watched values to avoid stale closure)
        const currentDiscountType = customerForm.getValues('discountType')
        const currentDiscountValue = customerForm.getValues('discountValue')

        // Calculate discount with priority: product > order
        const { discountAmount, salePrice } = applyDiscountWithPriority({
          unitPrice: product.price,
          productDiscountType: product.productDiscountType,
          productDiscountValue: product.productDiscountValue,
          orderDiscountType: currentDiscountType,
          orderDiscountValue: currentDiscountValue,
        })

        // Auto-fill product fields
        productForm.setValue('costPrice', product.costPrice)
        productForm.setValue('unitPrice', product.price)
        productForm.setValue('discountAmount', discountAmount)
        productForm.setValue('salePrice', salePrice)
      }
    } else if (fieldName === 'unitPrice') {
      // Read current discount values directly from form
      const currentDiscountType = customerForm.getValues('discountType')
      const currentDiscountValue = customerForm.getValues('discountValue')
      
      // Recalculate when unit price changes
      const currentProduct = productForm.getValues('productId')
      const product = extractProductValue(currentProduct)
      const unitPrice = value as number

      const { discountAmount, salePrice } = applyDiscountWithPriority({
        unitPrice,
        productDiscountType: product?.productDiscountType,
        productDiscountValue: product?.productDiscountValue,
        orderDiscountType: currentDiscountType,
        orderDiscountValue: currentDiscountValue,
      })

      productForm.setValue('discountAmount', discountAmount)
      productForm.setValue('salePrice', salePrice)
    }
  }, [productForm, customerForm])

  /**
   * Handle add to order
   */
  const handleAddToOrder = useCallback((data: ProductFormData) => {
    const product = extractProductValue(data.productId)
    
    if (!product) {
      toast.error('Please select a product')
      return
    }

    // Validate quantity
    if (data.quantity > product.availableQuantity) {
      toast.error(`Only ${product.availableQuantity} items available`)
      return
    }

    // Read current discount values directly from form
    const currentDiscountType = customerForm.getValues('discountType')
    const currentDiscountValue = customerForm.getValues('discountValue')

    // Determine which discount was applied
    const hasProductDiscount = product.productDiscountValue > 0
    const discountType = hasProductDiscount 
      ? product.productDiscountType 
      : currentDiscountType
    const discountValue = hasProductDiscount 
      ? product.productDiscountValue 
      : currentDiscountValue

    // Add item to store
    addItem({
      productId: product.value,
      productName: product.label,
      quantity: data.quantity,
      costPrice: data.costPrice,
      unitPrice: data.unitPrice,
      discountType,
      discountValue,
      discountAmount: data.discountAmount,
      salePrice: data.salePrice,
      availableQuantity: product.availableQuantity,
    })

    toast.success(`${product.label} added to order`)

    // Reset product form
    productForm.reset({
      productId: '',
      quantity: 1,
      costPrice: 0,
      unitPrice: 0,
      discountAmount: 0,
      salePrice: 0,
    })
  }, [addItem, productForm, customerForm])

  /**
   * Handle mark as sold
   */
  const handleMarkAsSold = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    // Get form values
    const accountId = customerForm.getValues('accountId')
    const paidAmount = customerForm.getValues('paidAmount') || 0

    // Extract account ID if it's an object
    const extractedAccountId = typeof accountId === 'object' && accountId !== null && 'value' in accountId
      ? accountId.value
      : typeof accountId === 'string'
      ? accountId
      : null

    // Validate: if accounts enabled and payment provided, accountId is required
    if (isAccountsEnabled && paidAmount > 0 && !extractedAccountId) {
      toast.error('Please select a payment account')
      return
    }

    try {
      const totalSalePrice = getTotalSalePrice()
      const totalCostPrice = getTotalCostPrice()
      const dueAmount = Math.max(totalSalePrice - paidAmount, 0)

      // Prepare order data with proper typing
      const orderData: {
        customerId?: string
        locationId: string
        items: Array<{
          productId: string
          quantity: number
          unitPrice: number
          discount: number
          productName: string
        }>
        discountType: string
        discountValue: number
        totalPrice: number
        costPrice: number
        notes?: string
        status: 'completed'
        payment?: {
          paidAmount: number
          accountId: string
        }
        dueAmount?: number
      } = {
        customerId: customerId || undefined,
        locationId: 'default', // TODO: Get from location selector if needed
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discountAmount,
          productName: item.productName,
        })),
        discountType: orderDiscountType,
        discountValue: orderDiscountValue,
        totalPrice: totalSalePrice,
        costPrice: totalCostPrice,
        notes: notes || undefined,
        status: 'completed' as const,
      }

      // Add payment info if accounts enabled and payment is provided
      if (isAccountsEnabled && extractedAccountId && paidAmount > 0) {
        orderData.payment = {
          paidAmount,
          accountId: extractedAccountId,
        }
        orderData.dueAmount = dueAmount
      }

      console.log('Creating order with data:', orderData)
      return

      // Create and complete order
      const createResult = await createOrderMutation.mutateAsync(orderData as any)

      if (createResult.data?._id) {
        // Show success
        setShowSuccessPopover(true)
        setTimeout(() => setShowSuccessPopover(false), 3000)

        // Reset all
        clearAll()
        customerForm.reset({
          customerId: null,
          discountType: 'percentage',
          discountValue: 0,
          accountId: null,
          paidAmount: 0,
          notes: '',
        })
        productForm.reset()
        setPaidAmount(0)
      }
    } catch (error) {
      console.error('Failed to complete sale:', error)
      toast.error('Failed to complete sale')
    }
  }, [
    items,
    customerId,
    orderDiscountType,
    orderDiscountValue,
    notes,
    isAccountsEnabled,
    getTotalSalePrice,
    getTotalCostPrice,
    createOrderMutation,
    clearAll,
    customerForm,
    productForm,
  ])

  // =====================
  // Table Columns
  // =====================

  const columns: ColumnDef<SellOrderItem>[] = useMemo(() => [
    {
      accessorKey: 'productName',
      header: 'Product',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.productName}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => row.original.quantity,
    },
    {
      accessorKey: 'costPrice',
      header: 'Cost Price',
      cell: ({ row }) => formatCurrency(row.original.costPrice),
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) => formatCurrency(row.original.unitPrice),
    },
    {
      accessorKey: 'discountAmount',
      header: 'Discount',
      cell: ({ row }) => formatCurrency(row.original.discountAmount),
    },
    {
      accessorKey: 'salePrice',
      header: 'Sale Price',
      cell: ({ row }) => formatCurrency(row.original.salePrice),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeItem(row.original.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ], [removeItem])

  // =====================
  // Render
  // =====================

  const isLoading = createOrderMutation.isPending || fulfillOrderMutation.isPending

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-muted-foreground">
          Create a new sale and record stock movement
        </p>
      </div>

      {/* Section 1: Customer & Order Discount */}
      <Card>
        <CardContent className="pt-6">
          <DynamicForm
            form={customerForm}
            config={customerFormConfig}
            onFieldChange={handleCustomerFieldChange}
            hideCancel
          />
        </CardContent>
      </Card>

      {/* Section 2: Product Selection */}
      <Card>
        <CardContent className="pt-6">
          <DynamicForm
            form={productForm}
            config={productFormConfig}
            onSubmit={handleAddToOrder}
            onFieldChange={handleProductFieldChange}
            submitLabel="Add to Order"
            hideCancel
          />
        </CardContent>
      </Card>

      {/* Section 4: Order Summary */}
      {items.length > 0 && (
        <Card>
          <Collapsible open={isOrderOpen} onOpenChange={setIsOrderOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {customerName || 'Walk-in Customer'}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                  </CardTitle>
                  {isOrderOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent>
                {/* Items Table */}
                <CardTable
                  columns={columns}
                  data={items}
                  emptyMessage="No items in order"
                  showCard={false}
                />

                <Separator className="my-4" />

                {/* Summary Footer */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost Price</span>
                    <span>{formatCurrency(getTotalCostPrice())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Sale Price</span>
                    <span className="text-primary">{formatCurrency(getTotalSalePrice())}</span>
                  </div>
                  
                  {/* Payment Info - only show if accounts enabled */}
                  {isAccountsEnabled && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid Amount</span>
                        <span className="text-green-600">{formatCurrency(paidAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-muted-foreground">Due Amount</span>
                        <span className="text-orange-600">
                          {formatCurrency(Math.max(getTotalSalePrice() - (paidAmount || 0), 0))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Actions */}
                <div className="flex gap-4">
                  <Popover open={showSuccessPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        onClick={handleMarkAsSold}
                        disabled={isLoading || items.length === 0}
                        className="flex-1"
                      >
                        {isLoading ? 'Processing...' : 'Mark as Sold'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                      <div className="flex items-center gap-2 text-green-600">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-medium">Sale completed successfully!</span>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={isLoading}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  )
}

