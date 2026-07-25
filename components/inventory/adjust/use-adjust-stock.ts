// coding-standard: maintained
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ClipboardEdit, ListChecks, SendHorizonal, Wallet } from 'lucide-react'
import type { StatData } from '@/ui/components/StatsCard'
import { formatCurrency } from '@/lib/currency'
import { itemValueDelta } from '@/components/inventory/adjust/adjustment-value'
import {
  useStockAdjustmentStore,
  AdjustmentItem,
} from '@/services/stores/stock-adjustment-store'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { useBulkAdjustStock } from '@/services/api'
import { InventoryProduct } from '@/components/inventory/inventory-search'
import { toBaseUnit, fromBaseUnit } from '@/utils/uom-conversion'

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
    // #2: decreasing an expiry-tracked product via adjustment desyncs the batch
    // ledger (FEFO write-off not built) — block it, matching the backend.
    if (isExpiryTracked && isDecrease) {
      toast.error(t('adjust.expiryDecreaseUnsupported'))
      return
    }
    // #3: adding expiry-tracked stock needs an expiry date (else no batch is made).
    if (showExpiryFields && !expiryDate) {
      toast.error(t('adjust.expiryRequired'))
      return
    }
    // #1: a cost-less row needs a unit cost for the added units, else they value at 0.
    if (needsCost && (!costInput || costInput <= 0)) {
      toast.error(t('adjust.costRequired'))
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
  const steps = [
    { label: t('shared.stepAddItems'), description: t('adjust.stepAddDesc') },
    { label: t('shared.stepReview'), description: t('shared.stepPendingCount', { count: items.length }) },
    { label: t('shared.stepSubmit'), description: t('adjust.stepSubmitDesc') },
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
  // Net value impact at cost (signed): what the correction adds to / removes from stock value.
  const netValue = items.reduce((sum, i) => sum + itemValueDelta(i), 0)
  const netValueLabel = `${netValue < 0 ? '-' : '+'}${formatCurrency(Math.abs(netValue))}`

  const pendingStats: StatData[] = [
    {
      label: t('adjust.statPendingItems'),
      value: items.length,
      icon: ListChecks,
      variant: items.length > 0 ? 'primary' : 'default',
    },
    {
      label: t('adjust.statIncrease'),
      value: `+${totalIncrease}`,
      icon: ClipboardEdit,
      variant: 'success',
      description: t('adjust.statIncreaseDesc'),
    },
    {
      label: t('adjust.statDecrease'),
      value: `-${totalDecrease}`,
      icon: SendHorizonal,
      variant: totalDecrease > 0 ? 'destructive' : 'default',
      description: t('adjust.statDecreaseDesc'),
    },
    {
      label: t('adjust.statNetValue'),
      value: netValueLabel,
      icon: Wallet,
      variant: netValue > 0 ? 'success' : netValue < 0 ? 'destructive' : 'default',
      description: t('adjust.statNetValueDesc'),
    },
  ]

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
    // derived
    hasUOM,
    computedBaseQuantity,
    showExpiryFields,
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
