// coding-standard: maintained
import { useState } from 'react'
import { toast } from 'sonner'
import { ClipboardEdit, ListChecks, SendHorizonal } from 'lucide-react'
import type { StatData } from '@/ui/components/StatsCard'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
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
      setInputValue(fromBaseUnit(product.quantity, product.conversionFactor))
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

  // Show expiry/batch inputs for expiry-tracked products when stock is increasing.
  const showExpiryFields =
    expiryTrackingEnabled &&
    !!selectedProduct?.hasExpiry &&
    effectiveNewQuantity > (selectedProduct?.quantity ?? 0)

  const resetForm = () => {
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
    setExpiryDate('')
    setBatchNumber('')
  }

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

    resetForm()
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
    setNotes(item.notes || '')
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
      resetForm()
    } catch (error) {
      console.error('Bulk adjustment failed:', error)
    }
  }

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
    expiryDate,
    setExpiryDate,
    batchNumber,
    setBatchNumber,
    // derived
    hasUOM,
    computedBaseQuantity,
    showExpiryFields,
    addedInventoryIds,
    // store + mutation
    items,
    reason,
    setReason,
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
