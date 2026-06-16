'use client'

import { useState } from 'react'
import { Button } from '@/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card'
import { Badge } from '@/ui/components/badge'
import { Input } from '@/ui/components/input'
import { Textarea } from '@/ui/components/textarea'
import { Label } from '@/ui/components/label'
import { CardTable } from '@/ui/components/custom/card-table'
import { ColumnDef } from '@tanstack/react-table'
import {
  Pencil,
  Trash2,
  Trash,
  ClipboardEdit,
  ListChecks,
  SendHorizonal,
  Plus,
  ArrowRight,
  Package,
  X,
  ArrowLeftRight,
} from 'lucide-react'
import PageHeader from '@/ui/components/header'
import StepIndicator from '@/ui/components/StepIndicator'
import StatsCard, { type StatData } from '@/ui/components/StatsCard'
import {
  useStockAdjustmentStore,
  AdjustmentItem,
} from '@/services/stores/stock-adjustment-store'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { useBulkAdjustStock } from '@/services/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'
import {
  InventorySearch,
  InventoryProduct,
} from '@/components/inventory/inventory-search'
import { toBaseUnit, fromBaseUnit, formatQuantity } from '@/utils/uom-conversion'

export default function StockAdjustmentPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  // UOM: whether the user is entering quantity in purchase units
  const [inputInPurchaseUnit, setInputInPurchaseUnit] = useState(false)
  // UOM: the raw input value (in whichever unit mode is active)
  const [inputValue, setInputValue] = useState<number>(0)
  // Expiry batch capture (expiry-tracked products, on a stock increase)
  const [expiryDate, setExpiryDate] = useState<string>('')
  const [batchNumber, setBatchNumber] = useState<string>('')

  const { items, reason, addItem, updateItem, removeItem, setReason, clearAll } =
    useStockAdjustmentStore()
  const bulkAdjustMutation = useBulkAdjustStock()

  // Expiry tracking is feature-gated; batch inputs only matter for tracked products.
  const expiryTrackingEnabled = useAuthStore(
    (state) => !!state.user?.organization?.features?.expiryTracking,
  )

  // Handle product selection from search
  const handleProductSelect = (product: InventoryProduct) => {
    setSelectedProduct(product)
    setNotes('')
    setExpiryDate('')
    setBatchNumber('')
    // If product has UOM, default to purchase unit input
    if (product.enableUOMConversion && product.conversionFactor) {
      setInputInPurchaseUnit(true)
      const purchaseQty = fromBaseUnit(product.quantity, product.conversionFactor)
      setInputValue(purchaseQty)
      setNewQuantity(product.quantity) // base units
    } else {
      setInputInPurchaseUnit(false)
      setInputValue(product.quantity)
      setNewQuantity(product.quantity)
    }
  }

  // Compute the base-unit quantity from current input
  const hasUOM = selectedProduct?.enableUOMConversion && selectedProduct?.conversionFactor
  const computedBaseQuantity = hasUOM && inputInPurchaseUnit
    ? Math.round(toBaseUnit(inputValue, selectedProduct.conversionFactor!))
    : inputValue

  // Sync newQuantity whenever inputValue or mode changes
  const effectiveNewQuantity = computedBaseQuantity

  // Show expiry/batch inputs for expiry-tracked products when stock is increasing.
  const showExpiryFields =
    expiryTrackingEnabled &&
    !!selectedProduct?.hasExpiry &&
    effectiveNewQuantity > (selectedProduct?.quantity ?? 0)

  // Handle add or update item
  const handleAddOrUpdate = () => {
    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }
    if (effectiveNewQuantity < 0) {
      toast.error('Quantity must be non-negative')
      return
    }

    // Expiry/batch capture (only when shown for a tracked product on an increase)
    const expiryPayload = showExpiryFields
      ? {
          hasExpiry: true,
          expiryDate: expiryDate || undefined,
          batchNumber: batchNumber || undefined,
        }
      : {}

    if (editingId) {
      updateItem(editingId, {
        newQuantity: effectiveNewQuantity,
        notes: notes || undefined,
        ...expiryPayload,
      })
      setEditingId(null)
      toast.success('Item updated')
    } else {
      addItem({
        inventoryId: selectedProduct.value,
        productId: selectedProduct.productId,
        variantId: selectedProduct.variantId,
        currentQuantity: selectedProduct.quantity,
        newQuantity: effectiveNewQuantity,
        notes: notes || undefined,
        product_name: selectedProduct.label,
        price: selectedProduct.price,
        // UOM fields
        ...(hasUOM ? {
          enableUOMConversion: true,
          conversionFactor: selectedProduct.conversionFactor,
          purchaseUnitName: selectedProduct.purchaseUnitName,
          baseUnitName: selectedProduct.baseUnitName,
        } : {}),
        ...expiryPayload,
      })
      toast.success('Item added to list')
    }

    // Reset form
    setSelectedProduct(null)
    setNewQuantity(0)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
    setExpiryDate('')
    setBatchNumber('')
  }

  // Handle edit from table
  const handleEdit = (item: AdjustmentItem) => {
    setEditingId(item.id)
    setSelectedProduct({
      value: item.inventoryId,
      label: item.product_name,
      price: item.price,
      costPrice: 0,
      quantity: item.currentQuantity,
      productId: item.productId,
      variantId: item.variantId || null,
      enableUOMConversion: item.enableUOMConversion,
      conversionFactor: item.conversionFactor,
      purchaseUnitName: item.purchaseUnitName,
      baseUnitName: item.baseUnitName,
      hasExpiry: item.hasExpiry,
    })
    // If UOM enabled, show in purchase unit by default
    if (item.enableUOMConversion && item.conversionFactor) {
      setInputInPurchaseUnit(true)
      setInputValue(fromBaseUnit(item.newQuantity, item.conversionFactor))
    } else {
      setInputInPurchaseUnit(false)
      setInputValue(item.newQuantity)
    }
    setNewQuantity(item.newQuantity)
    setNotes(item.notes || '')
    setExpiryDate(item.expiryDate || '')
    setBatchNumber(item.batchNumber || '')
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setSelectedProduct(null)
    setNewQuantity(0)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
    setExpiryDate('')
    setBatchNumber('')
  }

  // Handle clear selected product
  const handleClearProduct = () => {
    setSelectedProduct(null)
    setNewQuantity(0)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setExpiryDate('')
    setBatchNumber('')
  }

  // Submit all adjustments
  const handleSubmitAll = async () => {
    if (items.length === 0) {
      toast.error('No items to submit')
      return
    }

    const adjustments = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      newQuantity: item.newQuantity,
      notes: item.notes,
      // Expiry batch capture (backend creates a batch only for tracked products)
      ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
      ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
    }))

    try {
      await bulkAdjustMutation.mutateAsync({ adjustments, reason: reason || undefined })
      clearAll()
      setSelectedProduct(null)
      setNewQuantity(0)
      setInputValue(0)
      setInputInPurchaseUnit(false)
      setNotes('')
    } catch (error) {
      console.error('Bulk adjustment failed:', error)
    }
  }

  // Compute quantity change for display
  const getQuantityChange = (current: number, newQty: number) => {
    const diff = newQty - current
    if (diff === 0) return { text: 'No change', className: 'text-muted-foreground' }
    if (diff > 0) return { text: `+${diff}`, className: 'text-green-600' }
    return { text: `${diff}`, className: 'text-red-500' }
  }

  const columns: ColumnDef<AdjustmentItem>[] = [
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.product_name}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(row.original.price)}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'currentQuantity',
      header: 'Current',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <span className="text-muted-foreground tabular-nums">
              {item.currentQuantity}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </span>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground">
                ≈{formatQuantity(fromBaseUnit(item.currentQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'arrow',
      header: '',
      cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    },
    {
      accessorKey: 'newQuantity',
      header: 'New Qty',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <span className="font-semibold tabular-nums">
              {item.newQuantity}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </span>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground">
                ≈{formatQuantity(fromBaseUnit(item.newQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'change',
      header: 'Change',
      cell: ({ row }) => {
        const item = row.original
        const change = getQuantityChange(item.currentQuantity, item.newQuantity)
        return (
          <div>
            <Badge variant="outline" className={change.className}>
              {change.text}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </Badge>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.newQuantity - item.currentQuantity > 0 ? '+' : ''}
                {formatQuantity(fromBaseUnit(item.newQuantity - item.currentQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {row.original.notes || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(row.original)}
            disabled={editingId === row.original.id}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => removeItem(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  // Step indicator
  const currentStep = items.length === 0 ? 0 : 1
  const steps = [
    { label: 'Add Items', description: 'Select products to adjust' },
    { label: 'Review', description: `${items.length} item(s) pending` },
    { label: 'Submit', description: 'Confirm adjustments' },
  ]

  // Stats
  const totalIncrease = items.reduce((sum, i) => {
    const diff = i.newQuantity - i.currentQuantity
    return diff > 0 ? sum + diff : sum
  }, 0)
  const totalDecrease = items.reduce((sum, i) => {
    const diff = i.newQuantity - i.currentQuantity
    return diff < 0 ? sum + Math.abs(diff) : sum
  }, 0)

  const pendingStats: StatData[] = [
    {
      label: 'Pending Items',
      value: items.length,
      icon: ListChecks,
      variant: items.length > 0 ? 'primary' : 'default',
    },
    {
      label: 'Stock Increase',
      value: `+${totalIncrease}`,
      icon: ClipboardEdit,
      variant: 'success',
      description: 'Units to add',
    },
    {
      label: 'Stock Decrease',
      value: `-${totalDecrease}`,
      icon: SendHorizonal,
      variant: totalDecrease > 0 ? 'destructive' : 'default',
      description: 'Units to remove',
    },
  ]

  // Already-added inventory IDs (for filtering search results)
  const addedInventoryIds = items.map((i) => i.inventoryId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Adjustment"
        subTitle="Manually adjust stock quantities for inventory items"
      />

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} compact />

      {/* Stats (shown when items exist) */}
      {items.length > 0 && (
        <StatsCard data={pendingStats} columns={{ default: 1, sm: 3 }} />
      )}

      {/* Add/Edit Item Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardEdit className="h-5 w-5 text-primary" />
                {editingId ? 'Edit Adjustment' : 'Add Adjustment'}
              </CardTitle>
              <CardDescription>
                {editingId
                  ? 'Update the quantity for this item'
                  : 'Search and select a product, set the new quantity, and add it to the list'}
              </CardDescription>
            </div>
            {editingId && (
              <Badge variant="secondary">Editing</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Product Search */}
          {!selectedProduct ? (
            <div className="space-y-1.5">
              <Label>Search Product</Label>
              <InventorySearch
                onSelect={handleProductSelect}
                placeholder="Search products by name or category..."
                excludeIds={editingId ? [] : addedInventoryIds}
              />
            </div>
          ) : (
            <>
              {/* Selected Product Display */}
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{selectedProduct.label}</div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span>{formatCurrency(selectedProduct.price)}</span>
                    <span className="text-xs">|</span>
                    <span
                      className={
                        selectedProduct.quantity === 0
                          ? 'text-red-500 font-medium'
                          : selectedProduct.quantity <= 5
                            ? 'text-orange-500 font-medium'
                            : 'text-green-600 font-medium'
                      }
                    >
                      {selectedProduct.quantity}{selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''} in stock
                    </span>
                    {hasUOM && (
                      <>
                        <span className="text-xs">|</span>
                        <span className="text-xs flex items-center gap-1">
                          <ArrowLeftRight className="h-3 w-3" />
                          1 {selectedProduct.purchaseUnitName} = {selectedProduct.conversionFactor} {selectedProduct.baseUnitName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {!editingId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleClearProduct}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Quantity & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newQuantity">
                      New Quantity
                      <span className="text-muted-foreground text-xs ml-2">
                        (Current: {selectedProduct.quantity}{selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''})
                      </span>
                    </Label>
                    {/* UOM unit toggle */}
                    {hasUOM && (
                      <button
                        type="button"
                        onClick={() => {
                          if (inputInPurchaseUnit) {
                            // Switch to base unit: convert current purchase value to base
                            setInputInPurchaseUnit(false)
                            setInputValue(computedBaseQuantity)
                          } else {
                            // Switch to purchase unit: convert current base value to purchase
                            setInputInPurchaseUnit(true)
                            setInputValue(fromBaseUnit(inputValue, selectedProduct.conversionFactor!))
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        Switch to {inputInPurchaseUnit ? selectedProduct.baseUnitName : selectedProduct.purchaseUnitName}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="newQuantity"
                      type="number"
                      min={0}
                      step={hasUOM && inputInPurchaseUnit ? 'any' : 1}
                      value={inputValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setInputValue(Math.max(0, val))
                      }}
                      placeholder={`Enter quantity in ${hasUOM && inputInPurchaseUnit ? selectedProduct.purchaseUnitName : (selectedProduct.baseUnitName || 'units')}`}
                      className="h-11 pr-16"
                    />
                    {/* Unit badge inside input */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {hasUOM && inputInPurchaseUnit ? selectedProduct.purchaseUnitName : (selectedProduct.baseUnitName || 'units')}
                    </span>
                  </div>
                  {/* UOM conversion breakdown */}
                  {hasUOM && (
                    <p className="text-xs text-muted-foreground">
                      = {formatQuantity(computedBaseQuantity)} {selectedProduct.baseUnitName}
                      {inputInPurchaseUnit
                        ? ''
                        : ` (≈${formatQuantity(fromBaseUnit(computedBaseQuantity, selectedProduct.conversionFactor!))} ${selectedProduct.purchaseUnitName})`
                      }
                    </p>
                  )}
                  {/* Change indicator */}
                  {computedBaseQuantity !== selectedProduct.quantity && (
                    <p className={`text-xs font-medium ${
                      computedBaseQuantity > selectedProduct.quantity ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {computedBaseQuantity > selectedProduct.quantity ? '+' : ''}
                      {computedBaseQuantity - selectedProduct.quantity} {selectedProduct.baseUnitName || 'units'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Physical count, damage, theft..."
                    className="h-11"
                  />
                </div>
              </div>

              {/* Expiry batch (expiry-tracked products, on a stock increase) */}
              {showExpiryFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-dashed bg-muted/20 p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiryDate">
                      Expiry Date
                      <span className="text-muted-foreground text-xs ml-2">
                        (for the added stock)
                      </span>
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="batchNumber">
                      Batch Number{' '}
                      <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="batchNumber"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g., LOT-2026-01"
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={handleAddOrUpdate} className="gap-2">
                  {editingId ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Update Item
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to List
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Reason (shown when items exist) */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="reason">
                Adjustment Reason <span className="text-muted-foreground text-xs">(optional, applies to all items)</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for stock adjustment (e.g., physical count discrepancy, inventory audit, damage report...)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <CardTable
          title={`Adjustment Items (${items.length})`}
          description="Review items before submitting. All adjustments are processed as a single transaction."
          headerAction={
            <Button
              variant="destructive"
              size="icon"
              onClick={clearAll}
              title="Clear all items"
            >
              <Trash className="h-4 w-4" />
            </Button>
          }
          columns={columns}
          data={items}
          emptyMessage="No items to adjust"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkAdjustMutation.isPending,
              disabled: bulkAdjustMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Submit Stock Adjustments?',
              confirmationDescription: `This will adjust stock for ${items.length} item(s). This action processes as a single transaction and cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
