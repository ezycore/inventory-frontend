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
import { BatchCaptureFields } from '@/components/inventory/adjust/batch-capture-fields'
import { BatchDrawPicker } from '@/components/inventory/adjust/batch-draw-picker'
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
import { MAX_TRANSACTION_QUANTITY, type AdjustStockContext } from './use-adjust-stock'

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
    batchTarget,
    setBatchTarget,
    batchId,
    setBatchId,
    batchDraws,
    setBatchDraws,
    hasUOM,
    computedBaseQuantity,
    showExpiryFields,
    showBatchDraws,
    removedQuantity,
    needsCost,
    isNoChange,
    quantityError,
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
                  {/* NO `min`, and no `Math.max` on the way in — both silently
                      rewrote a mistyped `-5` into `0`, which is a legal
                      quantity meaning "set this location's stock to nothing".
                      A merchant who meant "remove 5" wrote off every unit they
                      held, with the API's own guard never seeing a negative to
                      reject (QA-R13). `NumberField` clamps to `min` on blur, so
                      leaving `min={0}` here would have kept the bug after the
                      `Math.max` was removed. The number now lands as typed and
                      is judged below. */}
                  <NumberField
                    id="newQuantity"
                    precision={hasUOM && inputInPurchaseUnit ? undefined : 0}
                    value={inputValue}
                    onChange={(v) => setInputValue(v ?? 0)}
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
                  {selectedProduct.baseUnitName && (
                    <span className="text-muted-foreground text-xs ml-1">
                      {t('adjust.perUnit', { unit: selectedProduct.baseUnitName })}
                    </span>
                  )}
                  <span className="text-amber-600 dark:text-amber-500 text-xs ml-2">
                    {t('adjust.noCostOnRecord')}
                  </span>
                </Label>
                <div className="relative">
                  <NumberField
                    id="unitCost"
                    precision={2}
                    min={0}
                    value={costInput}
                    onChange={setCostInput}
                    placeholder={t('adjust.unitCostPlaceholder')}
                    className="h-11 pr-16"
                  />
                  {/* Cost is ALWAYS per base unit — never the purchase unit — so a
                      box-mode entry can't be mistaken for a box price. */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    /{selectedProduct.baseUnitName || t('shared.unitsFallback')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('adjust.unitCostHint')}
                </p>
              </div>
            )}

            {/* Expiry batch (expiry-tracked products, on a stock increase) */}
            {showExpiryFields && (
              <BatchCaptureFields
                productId={selectedProduct.productId}
                variantId={selectedProduct.variantId}
                target={batchTarget}
                onTargetChange={setBatchTarget}
                batchId={batchId}
                onBatchIdChange={setBatchId}
                expiryDate={expiryDate}
                onExpiryDateChange={setExpiryDate}
                batchNumber={batchNumber}
                onBatchNumberChange={setBatchNumber}
              />
            )}

            {/* Which lots a decrease of an expiry-tracked product comes out of */}
            {showBatchDraws && (
              <BatchDrawPicker
                productId={selectedProduct.productId}
                variantId={selectedProduct.variantId}
                draws={batchDraws}
                onChange={setBatchDraws}
                removedQuantity={removedQuantity}
                unitName={selectedProduct.baseUnitName}
              />
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {/* An unchanged quantity books nothing — the row would be skipped. */}
              <Button
                onClick={handleAddOrUpdate}
                disabled={isNoChange || !!quantityError}
                className="gap-2"
              >
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
              {quantityError === 'negative' ? (
                <p className="text-xs text-destructive">
                  {t('adjust.quantityNegativeHint')}
                </p>
              ) : quantityError === 'max' ? (
                <p className="text-xs text-destructive">
                  {t('adjust.quantityTooLarge', { max: MAX_TRANSACTION_QUANTITY })}
                </p>
              ) : isNoChange ? (
                <p className="text-xs text-muted-foreground">
                  {t('adjust.noChangeError')}
                </p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
