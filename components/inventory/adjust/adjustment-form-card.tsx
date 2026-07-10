"use client";
// coding-standard: maintained

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card'
import { Badge } from '@/ui/components/badge'
import { Button } from '@/ui/components/button'
import { Input } from '@/ui/components/input'
import { Label } from '@/ui/components/label'
import { NumberField } from '@/ui/components/number-field'
import { DatePicker } from '@/ui/components/date-picker'
import {
  ArrowLeftRight,
  ClipboardEdit,
  Package,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { InventorySearch } from '@/components/inventory/inventory-search'
import { fromBaseUnit, formatQuantity } from '@/utils/uom-conversion'
import type { AdjustStockContext } from './use-adjust-stock'

/** The "Add/Edit Adjustment" card: product search, quantity, notes, expiry batch. */
export function AdjustmentFormCard({ ctx }: { ctx: AdjustStockContext }) {
  const {
    editingId,
    selectedProduct,
    notes,
    setNotes,
    inputInPurchaseUnit,
    setInputInPurchaseUnit,
    inputValue,
    setInputValue,
    expiryDate,
    setExpiryDate,
    batchNumber,
    setBatchNumber,
    hasUOM,
    computedBaseQuantity,
    showExpiryFields,
    addedInventoryIds,
    handleProductSelect,
    handleAddOrUpdate,
    handleCancelEdit,
    handleClearProduct,
  } = ctx

  return (
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
                  <NumberField
                    id="newQuantity"
                    precision={hasUOM && inputInPurchaseUnit ? undefined : 0}
                    min={0}
                    value={inputValue}
                    onChange={(v) => setInputValue(Math.max(0, v ?? 0))}
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
                  <DatePicker
                    date={expiryDate || undefined}
                    onSelect={(d) => setExpiryDate(d ?? '')}
                    className="h-11"
                    placeholder="Pick expiry date"
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
  )
}
