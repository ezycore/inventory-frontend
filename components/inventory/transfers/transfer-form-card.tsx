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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select'
import {
  ArrowLeftRight,
  ArrowRightLeft,
  Package,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { InventorySearch } from '@/components/inventory/inventory-search'
import { fromBaseUnit, formatQuantity } from '@/utils/uom-conversion'
import type { TransferStockContext } from './use-transfer-stock'

/** The "Add/Edit Transfer" card: location selectors, product search, quantity, notes. */
export function TransferFormCard({ ctx }: { ctx: TransferStockContext }) {
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
    hasUOM,
    computedBaseQuantity,
    addedInventoryIds,
    bothLocationsSelected,
    fromLocationOptions,
    toLocationOptions,
    fromLocationId,
    toLocationId,
    handleFromLocationChange,
    handleToLocationChange,
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
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              {editingId ? t('transfers.editTitle') : t('transfers.addTitle')}
            </CardTitle>
            <CardDescription>
              {editingId
                ? t('transfers.editDescription')
                : t('transfers.addDescription')}
            </CardDescription>
          </div>
          {editingId && (
            <Badge variant="secondary">{t('shared.editing')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Location Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('transfers.fromLocation')}</Label>
            <Select
              value={fromLocationId}
              onValueChange={handleFromLocationChange}
              disabled={!!editingId}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t('transfers.selectSource')} />
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
            <Label>{t('transfers.toLocation')}</Label>
            <Select
              value={toLocationId}
              onValueChange={handleToLocationChange}
              disabled={!!editingId}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t('transfers.selectDestination')} />
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
                <Label>{t('shared.searchProduct')}</Label>
                <InventorySearch
                  key={fromLocationId}
                  onSelect={handleProductSelect}
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
                        {t('transfers.availableSuffix', {
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
                      <Label htmlFor="transferQuantity">
                        {t('transfers.transferQuantity')}
                        <span className="text-muted-foreground text-xs ml-2">
                          {t('transfers.maxHint', {
                            stock: `${selectedProduct.quantity}${selectedProduct.baseUnitName ? ` ${selectedProduct.baseUnitName}` : ''}`,
                          })}
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
                          {t('shared.switchTo', {
                            unit: inputInPurchaseUnit ? selectedProduct.baseUnitName : selectedProduct.purchaseUnitName,
                          })}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <NumberField
                        id="transferQuantity"
                        precision={hasUOM && inputInPurchaseUnit ? undefined : 0}
                        min={0}
                        max={hasUOM && inputInPurchaseUnit
                          ? fromBaseUnit(selectedProduct.quantity, selectedProduct.conversionFactor!)
                          : selectedProduct.quantity
                        }
                        value={inputValue}
                        onChange={(v) => setInputValue(Math.max(0, v ?? 0))}
                        placeholder={t('shared.enterQuantityIn', {
                          unit: hasUOM && inputInPurchaseUnit ? selectedProduct.purchaseUnitName : (selectedProduct.baseUnitName || t('shared.unitsFallback')),
                        })}
                        className="h-11 pr-16"
                      />
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
                    {/* Stock warning */}
                    {computedBaseQuantity > selectedProduct.quantity && (
                      <p className="text-xs font-medium text-red-500">
                        {t('transfers.exceedsStock', {
                          amount: computedBaseQuantity - selectedProduct.quantity,
                          unit: selectedProduct.baseUnitName || t('shared.unitsFallback'),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">{t('shared.notesOptional')}</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('transfers.notesPlaceholder')}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
