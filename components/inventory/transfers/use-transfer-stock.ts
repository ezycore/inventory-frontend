// coding-standard: maintained
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ListChecks, MapPin, Package } from 'lucide-react'
import type { StatData } from '@/ui/components/StatsCard'
import {
  useTransferStore,
  TransferItem,
} from '@/services/stores/stock-transfer-store'
import { useBulkTransferStock, useSelectOptions } from '@/services/api'
import { InventoryProduct } from '@/components/inventory/inventory-search'
import { toBaseUnit, fromBaseUnit } from '@/utils/uom-conversion'

export type TransferStockContext = ReturnType<typeof useTransferStock>

/** State, derived values, and handlers for the Transfer Stock page. */
export function useTransferStock() {
  const t = useTranslations('inventory')
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

  const resetForm = () => {
    setSelectedProduct(null)
    setInputValue(0)
    setInputInPurchaseUnit(false)
    setNotes('')
  }

  // Handle from location change
  const handleFromLocationChange = (value: string) => {
    const location = locations.find((l: any) => l.value === value) as any
    if (!location) return

    if (items.length > 0) {
      toast.info(t('transfers.itemsCleared'))
    }
    setFromLocation(value, location.label || location.name)
    resetForm()
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
      toast.error(t('shared.selectProductFirst'))
      return
    }
    if (computedBaseQuantity < 1) {
      toast.error(t('transfers.quantityMin'))
      return
    }
    if (computedBaseQuantity > selectedProduct.quantity) {
      toast.error(t('transfers.insufficientStock', { stock: selectedProduct.quantity }))
      return
    }

    if (editingId) {
      updateItem(editingId, {
        transferQuantity: computedBaseQuantity,
        notes: notes || undefined,
      })
      setEditingId(null)
      toast.success(t('shared.itemUpdated'))
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
      toast.success(t('shared.itemAdded'))
    }

    resetForm()
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
    resetForm()
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
      toast.error(t('shared.noItemsToSubmit'))
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
      resetForm()
    } catch (error) {
      console.error('Bulk transfer failed:', error)
    }
  }

  // Step indicator
  const currentStep = items.length === 0 ? 0 : 1
  const steps = [
    { label: t('shared.stepAddItems'), description: t('transfers.stepAddDesc') },
    { label: t('shared.stepReview'), description: t('shared.stepPendingCount', { count: items.length }) },
    { label: t('shared.stepSubmit'), description: t('transfers.stepSubmitDesc') },
  ]

  // Stats
  const totalUnits = items.reduce((sum, i) => sum + i.transferQuantity, 0)

  const pendingStats: StatData[] = [
    {
      label: t('transfers.statPending'),
      value: items.length,
      icon: ListChecks,
      variant: items.length > 0 ? 'primary' : 'default',
    },
    {
      label: t('transfers.statTotalUnits'),
      value: totalUnits,
      icon: Package,
      variant: 'info',
      description: t('transfers.statTotalUnitsDesc'),
    },
    {
      label: t('transfers.statRoute'),
      value: fromLocationName && toLocationName ? `${fromLocationName} → ${toLocationName}` : '-',
      icon: MapPin,
      variant: 'success',
      description: t('transfers.statRouteDesc'),
    },
  ]

  // Already-added inventory IDs (for filtering search results)
  const addedInventoryIds = items.map((i) => i.inventoryId)

  const bothLocationsSelected = !!fromLocationId && !!toLocationId

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
    // derived
    hasUOM,
    computedBaseQuantity,
    addedInventoryIds,
    bothLocationsSelected,
    // locations
    locations,
    locationsLoading,
    locationCount,
    fromLocationOptions,
    toLocationOptions,
    fromLocationId,
    toLocationId,
    fromLocationName,
    toLocationName,
    // store + mutation
    items,
    clearAll,
    removeItem,
    bulkTransferMutation,
    totalUnits,
    // handlers
    handleFromLocationChange,
    handleToLocationChange,
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
