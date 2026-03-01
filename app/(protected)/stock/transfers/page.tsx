'use client'

import { useState, useMemo } from 'react'
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
import { Label } from '@/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select'
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert'
import { CardTable } from '@/ui/components/custom/card-table'
import { ColumnDef } from '@tanstack/react-table'
import {
  Pencil,
  Trash2,
  Trash,
  ArrowRightLeft,
  ListChecks,
  Package,
  MapPin,
  Plus,
  X,
  ArrowLeftRight,
  Info,
} from 'lucide-react'
import PageHeader from '@/ui/components/header'
import StepIndicator from '@/ui/components/StepIndicator'
import StatsCard, { type StatData } from '@/ui/components/StatsCard'
import {
  useTransferStore,
  TransferItem,
} from '@/services/stores/stock-transfer-store'
import { useBulkTransferStock, useSelectOptions } from '@/services/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'
import {
  InventorySearch,
  InventoryProduct,
} from '@/components/inventory/inventory-search'
import { toBaseUnit, fromBaseUnit, formatQuantity } from '@/utils/uom-conversion'

export default function BulkStockTransferPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [inputValue, setInputValue] = useState<number>(0)
  const [inputInPurchaseUnit, setInputInPurchaseUnit] = useState(false)
  const [notes, setNotes] = useState<string>('')

  const {
    items,
    fromLocationId,
    toLocationId,
    fromLocationName,
    toLocationName,
    setFromLocation,
    setToLocation,
    addItem,
    updateItem,
    removeItem,
    clearAll,
  } = useTransferStore()
  const bulkTransferMutation = useBulkTransferStock()

  // Fetch all locations
  const { data: locations = [], isLoading: locationsLoading } = useSelectOptions('/locations')
  const locationCount = locations.length

  // Filter out destination options (exclude selected from location)
  const toLocationOptions = useMemo(
    () => locations.filter((loc: any) => loc.value !== fromLocationId),
    [locations, fromLocationId]
  )

  // Filter out source options (exclude selected to location)
  const fromLocationOptions = useMemo(
    () => locations.filter((loc: any) => loc.value !== toLocationId),
    [locations, toLocationId]
  )

  // Handle from location change
  const handleFromLocationChange = (value: string) => {
    const location = locations.find((l: any) => l.value === value) as any
    if (!location) return

    if (items.length > 0) {
      toast.info('Items cleared — source location changed')
    }
    setFromLocation(value, location.label || location.name)
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
  }

  // Handle to location change
  const handleToLocationChange = (value: string) => {
    const location = locations.find((l: any) => l.value === value) as any
    if (!location) return
    setToLocation(value, location.label || location.name)
  }

  // Handle product selection from search
  const handleProductSelect = (product: InventoryProduct) => {
    setSelectedProduct(product)
    setNotes('')
    if (product.enableUOMConversion && product.conversionFactor) {
      setInputInPurchaseUnit(true)
      setInputValue(0)
    } else {
      setInputInPurchaseUnit(false)
      setInputValue(0)
    }
  }

  // UOM helpers
  const hasUOM = selectedProduct?.enableUOMConversion && selectedProduct?.conversionFactor
  const computedBaseQuantity = hasUOM && inputInPurchaseUnit
    ? Math.round(toBaseUnit(inputValue, selectedProduct.conversionFactor!))
    : inputValue

  // Handle add or update item
  const handleAddOrUpdate = () => {
    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }
    if (computedBaseQuantity < 1) {
      toast.error('Transfer quantity must be at least 1')
      return
    }
    if (computedBaseQuantity > selectedProduct.quantity) {
      toast.error(`Insufficient stock. Available: ${selectedProduct.quantity}`)
      return
    }

    if (editingId) {
      updateItem(editingId, {
        transferQuantity: computedBaseQuantity,
        notes: notes || undefined,
      })
      setEditingId(null)
      toast.success('Item updated')
    } else {
      addItem({
        inventoryId: selectedProduct.value,
        productId: selectedProduct.productId,
        variantId: selectedProduct.variantId,
        transferQuantity: computedBaseQuantity,
        currentQuantity: selectedProduct.quantity,
        notes: notes || undefined,
        product_name: selectedProduct.label,
        price: selectedProduct.price,
        ...(hasUOM ? {
          enableUOMConversion: true,
          conversionFactor: selectedProduct.conversionFactor,
          purchaseUnitName: selectedProduct.purchaseUnitName,
          baseUnitName: selectedProduct.baseUnitName,
        } : {}),
      })
      toast.success('Item added to list')
    }

    // Reset form
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
  }

  // Handle edit from table
  const handleEdit = (item: TransferItem) => {
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
    })
    if (item.enableUOMConversion && item.conversionFactor) {
      setInputInPurchaseUnit(true)
      setInputValue(fromBaseUnit(item.transferQuantity, item.conversionFactor))
    } else {
      setInputInPurchaseUnit(false)
      setInputValue(item.transferQuantity)
    }
    setNotes(item.notes || '')
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
  }

  // Handle clear selected product
  const handleClearProduct = () => {
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
  }

  // Submit all transfers
  const handleSubmitAll = async () => {
    if (items.length === 0) {
      toast.error('No items to submit')
      return
    }

    const transfers = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      fromLocationId,
      toLocationId,
      transferQuantity: item.transferQuantity,
      notes: item.notes,
    }))

    try {
      await bulkTransferMutation.mutateAsync(transfers)
      clearAll()
      setSelectedProduct(null)
      setInputValue(0)
      setInputInPurchaseUnit(false)
      setNotes('')
    } catch (error) {
      console.error('Bulk transfer failed:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<TransferItem>[] = [
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
      header: 'Available',
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
      accessorKey: 'transferQuantity',
      header: 'Transfer Qty',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <span className="font-semibold tabular-nums">
              {item.transferQuantity}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </span>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground">
                ≈{formatQuantity(fromBaseUnit(item.transferQuantity, item.conversionFactor))} {item.purchaseUnitName}
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
    { label: 'Add Items', description: 'Select products to transfer' },
    { label: 'Review', description: `${items.length} item(s) pending` },
    { label: 'Submit', description: 'Confirm transfers' },
  ]

  // Stats
  const totalUnits = items.reduce((sum, i) => sum + i.transferQuantity, 0)

  const pendingStats: StatData[] = [
    {
      label: 'Pending Transfers',
      value: items.length,
      icon: ListChecks,
      variant: items.length > 0 ? 'primary' : 'default',
    },
    {
      label: 'Total Units',
      value: totalUnits,
      icon: Package,
      variant: 'info',
      description: 'Units to transfer',
    },
    {
      label: 'Route',
      value: fromLocationName && toLocationName ? `${fromLocationName} → ${toLocationName}` : '-',
      icon: MapPin,
      variant: 'success',
      description: 'Source → Destination',
    },
  ]

  // Already-added inventory IDs (for filtering search results)
  const addedInventoryIds = items.map((i) => i.inventoryId)

  const bothLocationsSelected = !!fromLocationId && !!toLocationId

  // Single-location guard
  if (!locationsLoading && locationCount <= 1) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stock Transfer"
          subTitle="Transfer stock between locations"
        />
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Stock Transfer Not Available</AlertTitle>
          <AlertDescription>
            Stock transfer requires at least two locations. You currently have{' '}
            {locationCount === 0 ? 'no locations' : 'only one location'} configured.
            Please add more locations before using this feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Transfer (Bulk)"
        subTitle="Transfer stock between locations"
      />

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} compact />

      {/* Stats (shown when items exist) */}
      {items.length > 0 && (
        <StatsCard data={pendingStats} columns={{ default: 1, sm: 3 }} />
      )}

      {/* Transfer Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                {editingId ? 'Edit Transfer' : 'Add Transfer'}
              </CardTitle>
              <CardDescription>
                {editingId
                  ? 'Update the transfer quantity for this item'
                  : 'Select locations, search a product, set the quantity, and add to the list'}
              </CardDescription>
            </div>
            {editingId && (
              <Badge variant="secondary">Editing</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Location Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>From Location</Label>
              <Select
                value={fromLocationId}
                onValueChange={handleFromLocationChange}
                disabled={!!editingId}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select source location" />
                </SelectTrigger>
                <SelectContent>
                  {fromLocationOptions.map((loc: any) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label || loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To Location</Label>
              <Select
                value={toLocationId}
                onValueChange={handleToLocationChange}
                disabled={!!editingId}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {toLocationOptions.map((loc: any) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label || loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Search (only when both locations selected) */}
          {bothLocationsSelected && (
            <>
              {!selectedProduct ? (
                <div className="space-y-1.5">
                  <Label>Search Product</Label>
                  <InventorySearch
                    key={fromLocationId}
                    onSelect={handleProductSelect}
                    placeholder="Search products by name or category..."
                    excludeIds={editingId ? [] : addedInventoryIds}
                    apiUrl={`/inventory/adjustable-products?locationId=${fromLocationId}`}
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
                          {selectedProduct.quantity}{selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''} available
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
                        <Label htmlFor="transferQuantity">
                          Transfer Quantity
                          <span className="text-muted-foreground text-xs ml-2">
                            (Max: {selectedProduct.quantity}{selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''})
                          </span>
                        </Label>
                        {hasUOM && (
                          <button
                            type="button"
                            onClick={() => {
                              if (inputInPurchaseUnit) {
                                setInputInPurchaseUnit(false)
                                setInputValue(computedBaseQuantity)
                              } else {
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
                          id="transferQuantity"
                          type="number"
                          min={0}
                          max={hasUOM && inputInPurchaseUnit
                            ? fromBaseUnit(selectedProduct.quantity, selectedProduct.conversionFactor!)
                            : selectedProduct.quantity
                          }
                          step={hasUOM && inputInPurchaseUnit ? 'any' : 1}
                          value={inputValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setInputValue(Math.max(0, val))
                          }}
                          placeholder={`Enter quantity in ${hasUOM && inputInPurchaseUnit ? selectedProduct.purchaseUnitName : (selectedProduct.baseUnitName || 'units')}`}
                          className="h-11 pr-16"
                        />
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
                      {/* Stock warning */}
                      {computedBaseQuantity > selectedProduct.quantity && (
                        <p className="text-xs font-medium text-red-500">
                          Exceeds available stock by {computedBaseQuantity - selectedProduct.quantity} {selectedProduct.baseUnitName || 'units'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., Restock branch, seasonal move..."
                        className="h-11"
                      />
                    </div>
                  </div>

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
            </>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      {items.length > 0 && (
        <CardTable
          title={`Transfers to Process (${items.length})`}
          description={`${fromLocationName} → ${toLocationName} · Review items before submitting.`}
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
              confirmationDescription: `This will transfer ${totalUnits} unit(s) across ${items.length} product(s) from ${fromLocationName} to ${toLocationName}. This action cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
