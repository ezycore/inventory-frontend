"use client";
// coding-standard: maintained

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('inventory')
  const tCommon = useTranslations('common.actions')
  const {
    editingId,
    selectedProduct,
    notes,
    setNotes,
    inputInPurchaseUnit,
    setInputInPurchaseUnit,
    inputValue,
    setInputValue,
    costInput,
    setCostInput,
    expiryDate,
    setExpiryDate,
    batchNumber,
    setBatchNumber,
    hasUOM,
    computedBaseQuantity,
    showExpiryFields,
    needsCost,
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
              {editingId ? t('adjust.editTitle') : t('adjust.addTitle')}
            </CardTitle>
            <CardDescription>
              {editingId
                ? t('adjust.editDescription')
                : t('adjust.addDescription')}
            </CardDescription>
          </div>
          {editingId && (
            <Badge variant="secondary">{t('shared.editing')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Product Search */}
        {!selectedProduct ? (
          <div className="space-y-1.5">
            <Label>{t('shared.searchProduct')}</Label>
            <InventorySearch
              onSelect={handleProductSelect}
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
                    {t('adjust.inStockSuffix', {
                      stock: `${selectedProduct.quantity}${selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''}`,
                    })}
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
                    {t('adjust.newQuantity')}
                    <span className="text-muted-foreground text-xs ml-2">
                      {t('adjust.currentHint', {
                        stock: `${selectedProduct.quantity}${selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''}`,
                      })}
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
                      {t('shared.switchTo', {
                        unit: inputInPurchaseUnit ? selectedProduct.baseUnitName : selectedProduct.purchaseUnitName,
                      })}
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
                    placeholder={t('shared.enterQuantityIn', {
                      unit: hasUOM && inputInPurchaseUnit ? selectedProduct.purchaseUnitName : (selectedProduct.baseUnitName || t('shared.unitsFallback')),
                    })}
                    className="h-11 pr-16"
                  />
                  {/* Unit badge inside input */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {hasUOM && inputInPurchaseUnit ? selectedProduct.purchaseUnitName : (selectedProduct.baseUnitName || t('shared.unitsFallback'))}
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
                    {computedBaseQuantity - selectedProduct.quantity} {selectedProduct.baseUnitName || t('shared.unitsFallback')}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t('shared.notesOptional')}</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('adjust.notesPlaceholder')}
                  className="h-11"
                />
              </div>
            </div>

            {/* Unit cost — only when the row has no cost basis and stock is increasing */}
            {needsCost && (
              <div className="space-y-1.5 rounded-lg border border-dashed border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                <Label htmlFor="unitCost">
                  {t('adjust.unitCostLabel')}
                  <span className="text-amber-600 dark:text-amber-500 text-xs ml-2">
                    {t('adjust.noCostOnRecord')}
                  </span>
                </Label>
                <NumberField
                  id="unitCost"
                  precision={2}
                  min={0}
                  value={costInput}
                  onChange={setCostInput}
                  placeholder={t('adjust.unitCostPlaceholder')}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  {t('adjust.unitCostHint')}
                </p>
              </div>
            )}

            {/* Expiry batch (expiry-tracked products, on a stock increase) */}
            {showExpiryFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-dashed bg-muted/20 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiryDate">
                    {t('adjust.expiryDateLabel')}
                    <span className="text-muted-foreground text-xs ml-2">
                      {t('adjust.expiryForAddedStock')}
                    </span>
                  </Label>
                  <DatePicker
                    date={expiryDate || undefined}
                    onSelect={(d) => setExpiryDate(d ?? '')}
                    className="h-11"
                    placeholder={t('adjust.pickExpiryDate')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="batchNumber">
                    {t('adjust.batchNumber')}{' '}
                    <span className="text-muted-foreground text-xs">({t('form.optionalPlaceholder')})</span>
                  </Label>
                  <Input
                    id="batchNumber"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder={t('adjust.batchPlaceholder')}
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
                    {t('shared.updateItem')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t('shared.addToList')}
                  </>
                )}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  {tCommon('cancel')}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
