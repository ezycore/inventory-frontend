// coding-standard: maintained
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  buildAdjustStats,
  buildAdjustSteps,
} from '@/components/inventory/adjust/adjust-page-chrome'
import {
  useStockAdjustmentStore,
  AdjustmentItem,
} from '@/services/stores/stock-adjustment-store'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { useBulkAdjustStock } from '@/services/api'
import { InventoryProduct } from '@/components/inventory/inventory-search'
import { toBaseUnit, fromBaseUnit } from '@/utils/uom-conversion'
import { useBatchDraws } from '@/components/inventory/adjust/use-batch-draws'

/** Where an increase of an expiry-tracked product lands. */
export type BatchTarget = 'new' | 'existing'

export type AdjustStockContext = ReturnType<typeof useAdjustStock>

/** State, derived values, and handlers for the Adjust Stock page. */
export function useAdjustStock() {
  const t = useTranslations('inventory')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [notes, setNotes] = useState<string>('')
  // UOM: whether the user is entering quantity in purchase units
  const [inputInPurchaseUnit, setInputInPurchaseUnit] = useState(false)
  // UOM: the raw input value (in whichever unit mode is active)
  const [inputValue, setInputValue] = useState<number>(0)
  // Cost for the added units — only needed when the row has no cost basis yet
  const [costInput, setCostInput] = useState<number | null>(null)
  // Expiry batch capture (expiry-tracked products, on a stock increase)
  const [expiryDate, setExpiryDate] = useState<string>('')
  const [batchNumber, setBatchNumber] = useState<string>('')
  // Whether an increase opens a new lot or tops up an existing one
  const [batchTarget, setBatchTarget] = useState<BatchTarget>('new')
  const [batchId, setBatchId] = useState<string>('')

  const {
    items,
    reason,
    defaultUnit,
    addItem,
    updateItem,
    removeItem,
    setReason,
    setDefaultUnit,
    clearAll,
  } = useStockAdjustmentStore()
  const bulkAdjustMutation = useBulkAdjustStock()

  // Expiry tracking is feature-gated; batch inputs only matter for tracked products.
  const expiryTrackingEnabled = useAuthStore(
    (state) => !!state.user?.organization?.features?.expiryTracking,
  )

  // Handle product selection from search
  const handleProductSelect = (product: InventoryProduct) => {
    setSelectedProduct(product)
    setNotes('')
    setCostInput(null)
    setExpiryDate('')
    setBatchNumber('')
    setBatchTarget('new')
    setBatchId('')
    // Drop any pinned rows so the new product gets its own suggestion.
    resetBatchDraws()
    // For a UOM product, open in the user's preferred default unit.
    if (product.enableUOMConversion && product.conversionFactor) {
      const usePurchase = defaultUnit === 'purchase'
      setInputInPurchaseUnit(usePurchase)
      setInputValue(
        usePurchase
          ? fromBaseUnit(product.quantity, product.conversionFactor)
          : product.quantity,
      )
    } else {
      setInputInPurchaseUnit(false)
      setInputValue(product.quantity)
    }
  }

  // Compute the base-unit quantity from current input
  const hasUOM = selectedProduct?.enableUOMConversion && selectedProduct?.conversionFactor
  const computedBaseQuantity = hasUOM && inputInPurchaseUnit
    ? Math.round(toBaseUnit(inputValue, selectedProduct.conversionFactor!))
    : inputValue

  const effectiveNewQuantity = computedBaseQuantity

  const currentQuantity = selectedProduct?.quantity ?? 0
  const isIncrease = effectiveNewQuantity > currentQuantity
  const isDecrease = effectiveNewQuantity < currentQuantity
  const isExpiryTracked = expiryTrackingEnabled && !!selectedProduct?.hasExpiry

  // Show expiry/batch inputs for expiry-tracked products when stock is increasing.
  const showExpiryFields = isExpiryTracked && isIncrease
  // A decrease has to say which lots the units leave from (backend requires it).
  const showBatchDraws = isExpiryTracked && isDecrease
  const removedQuantity = isDecrease ? currentQuantity - effectiveNewQuantity : 0

  const {
    draws: batchDraws,
    setDraws: setBatchDraws,
    resetDraws: resetBatchDraws,
    isBalanced: drawsBalanced,
  } = useBatchDraws({
    productId: selectedProduct?.productId,
    variantId: selectedProduct?.variantId,
    enabled: showBatchDraws,
    removedQuantity,
  })

  // Ask for a unit cost only when adding stock to a row that has no cost basis yet
  // (new row, or opening/transfer stock stored at 0/undefined). Mirrors the backend.
  const needsCost = isIncrease && !selectedProduct?.costPrice

  const resetForm = () => {
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
    setCostInput(null)
    setExpiryDate('')
    setBatchNumber('')
    setBatchTarget('new')
    setBatchId('')
    resetBatchDraws()
  }

  // Handle add or update item
  const handleAddOrUpdate = () => {
    if (!selectedProduct) {
      toast.error(t('shared.selectProductFirst'))
      return
    }
    if (effectiveNewQuantity < 0) {
      toast.error(t('adjust.quantityNonNegative'))
      return
    }
    // #2: a decrease has to name the lots it draws from, and they have to add up —
    // the batch ledger must stay equal to the aggregate quantity.
    if (showBatchDraws) {
      if (batchDraws.some((d) => !d.batchId || d.quantity <= 0)) {
        toast.error(t('adjust.drawRowsIncomplete'))
        return
      }
      if (!drawsBalanced) {
        toast.error(
          t('adjust.drawsMismatch', { required: removedQuantity }),
        )
        return
      }
    }
    // #3: adding expiry-tracked stock lands either in a new lot (needs an expiry
    // date) or in an existing one (needs the lot picked).
    if (showExpiryFields) {
      if (batchTarget === 'new' && !expiryDate) {
        toast.error(t('adjust.expiryRequired'))
        return
      }
      if (batchTarget === 'existing' && !batchId) {
        toast.error(t('adjust.batchRequired'))
        return
      }
    }
    // #1: a cost-less row needs a unit cost for the added units, else they value at 0.
    if (needsCost && (!costInput || costInput <= 0)) {
      toast.error(t('adjust.costRequired'))
      return
    }

    // Batch capture. An increase carries exactly one of expiryDate (new lot) or
    // batchId (existing lot); a decrease carries the per-lot draws. Every key is
    // always present so editing an item back to a different mode clears the old
    // one instead of leaving it merged in.
    const opensNewBatch = showExpiryFields && batchTarget === 'new'
    const expiryPayload = {
      hasExpiry: isExpiryTracked || undefined,
      expiryDate: opensNewBatch ? expiryDate || undefined : undefined,
      batchNumber: opensNewBatch ? batchNumber || undefined : undefined,
      batchId:
        showExpiryFields && batchTarget === 'existing' ? batchId : undefined,
      batchDraws: showBatchDraws ? batchDraws : undefined,
    }
    // Cost capture (only when the row has no cost basis and we're increasing)
    const costPayload = needsCost ? { costPrice: costInput ?? undefined } : {}

    if (editingId) {
      updateItem(editingId, {
        newQuantity: effectiveNewQuantity,
        notes: notes || undefined,
        ...expiryPayload,
        ...costPayload,
      })
      setEditingId(null)
      toast.success(t('shared.itemUpdated'))
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
        rowCostPrice: selectedProduct.costPrice,
        // UOM fields
        ...(hasUOM ? {
          enableUOMConversion: true,
          conversionFactor: selectedProduct.conversionFactor,
          purchaseUnitName: selectedProduct.purchaseUnitName,
          baseUnitName: selectedProduct.baseUnitName,
        } : {}),
        ...expiryPayload,
        ...costPayload,
      })
      toast.success(t('shared.itemAdded'))
    }

    resetForm()
  }

  // Handle edit from table
  const handleEdit = (item: AdjustmentItem) => {
    setEditingId(item.id)
    setSelectedProduct({
      value: item.inventoryId,
      label: item.product_name,
      price: item.price,
      costPrice: item.rowCostPrice ?? 0,
      quantity: item.currentQuantity,
      productId: item.productId,
      variantId: item.variantId || null,
      enableUOMConversion: item.enableUOMConversion,
      conversionFactor: item.conversionFactor,
      purchaseUnitName: item.purchaseUnitName,
      baseUnitName: item.baseUnitName,
      hasExpiry: item.hasExpiry,
    })
    // If UOM enabled, open in the user's preferred default unit
    if (item.enableUOMConversion && item.conversionFactor) {
      const usePurchase = defaultUnit === 'purchase'
      setInputInPurchaseUnit(usePurchase)
      setInputValue(
        usePurchase
          ? fromBaseUnit(item.newQuantity, item.conversionFactor)
          : item.newQuantity,
      )
    } else {
      setInputInPurchaseUnit(false)
      setInputValue(item.newQuantity)
    }
    setNotes(item.notes || '')
    setCostInput(item.costPrice ?? null)
    setExpiryDate(item.expiryDate || '')
    setBatchNumber(item.batchNumber || '')
    setBatchTarget(item.batchId ? 'existing' : 'new')
    setBatchId(item.batchId || '')
    // Seed the saved draws rather than re-suggesting over the user's choice.
    resetBatchDraws(item.batchDraws || [])
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  // Handle clear selected product
  const handleClearProduct = () => {
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setCostInput(null)
    setExpiryDate('')
    setBatchNumber('')
    setBatchTarget('new')
    setBatchId('')
    resetBatchDraws()
  }

  // Submit all adjustments
  const handleSubmitAll = async () => {
    if (items.length === 0) {
      toast.error(t('shared.noItemsToSubmit'))
      return
    }

    const adjustments = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      newQuantity: item.newQuantity,
      notes: item.notes,
      // Cost for the added units (backend uses it only when the row has no cost basis)
      ...(item.costPrice ? { costPrice: item.costPrice } : {}),
      // Expiry batch capture (backend creates a batch only for tracked products)
      ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
      ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
      ...(item.batchId ? { batchId: item.batchId } : {}),
      // Per-lot breakdown of a decrease — the API only wants id + quantity.
      ...(item.batchDraws?.length
        ? {
            batchDraws: item.batchDraws.map((d) => ({
              batchId: d.batchId,
              quantity: d.quantity,
            })),
          }
        : {}),
    }))

    try {
      await bulkAdjustMutation.mutateAsync({ adjustments, reason: reason || undefined })
      clearAll()
      resetForm()
    } catch (error) {
      console.error('Bulk adjustment failed:', error)
    }
  }

  // Step indicator
  const currentStep = items.length === 0 ? 0 : 1
  const steps = buildAdjustSteps(items.length, t)
  const pendingStats = buildAdjustStats(items, t)

  // Already-added inventory IDs (for filtering search results)
  const addedInventoryIds = items.map((i) => i.inventoryId)

  return {
    // form state
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
    // derived
    hasUOM,
    computedBaseQuantity,
    expiryTrackingEnabled,
    showExpiryFields,
    showBatchDraws,
    removedQuantity,
    needsCost,
    addedInventoryIds,
    // store + mutation
    items,
    reason,
    setReason,
    defaultUnit,
    setDefaultUnit,
    clearAll,
    removeItem,
    bulkAdjustMutation,
    // handlers
    handleProductSelect,
    handleAddOrUpdate,
    handleEdit,
    handleCancelEdit,
    handleClearProduct,
    handleSubmitAll,
    // page chrome
    currentStep,
    steps,
    pendingStats,
  }
}
