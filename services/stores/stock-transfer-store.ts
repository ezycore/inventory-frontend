import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface TransferItem {
  id: string
  inventoryId: string       // inventory record at source location
  productId: string
  variantId: string | null
  transferQuantity: number  // in base units
  currentQuantity: number   // stock at source location (for display)
  notes?: string
  // Display fields
  product_name: string
  price: number
  // UOM conversion fields (only when product supports UOM)
  enableUOMConversion?: boolean
  conversionFactor?: number
  purchaseUnitName?: string
  baseUnitName?: string
}

interface TransferStore {
  items: TransferItem[]
  fromLocationId: string
  toLocationId: string
  fromLocationName: string
  toLocationName: string
  setFromLocation: (id: string, name: string) => void
  setToLocation: (id: string, name: string) => void
  addItem: (item: Omit<TransferItem, 'id'>) => void
  updateItem: (id: string, data: Partial<TransferItem>) => void
  removeItem: (id: string) => void
  clearAll: () => void
}

export const useTransferStore = create<TransferStore>()(
  persist(
    (set) => ({
      items: [],
      fromLocationId: '',
      toLocationId: '',
      fromLocationName: '',
      toLocationName: '',

      setFromLocation: (id, name) =>
        set({
          fromLocationId: id,
          fromLocationName: name,
          items: [], // Clear items when source location changes
        }),

      setToLocation: (id, name) =>
        set({
          toLocationId: id,
          toLocationName: name,
        }),

      addItem: (item) =>
        set((state) => {
          // Check if item with same inventoryId already exists
          const existingIndex = state.items.findIndex(
            (existing) => existing.inventoryId === item.inventoryId
          )

          if (existingIndex !== -1) {
            // Replace the existing item (keep the last one)
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = { ...item, id: state.items[existingIndex].id }
            return { items: updatedItems }
          }

          // Add new item if not exists
          return { items: [...state.items, { ...item, id: uuidv4() }] }
        }),

      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearAll: () =>
        set({
          items: [],
          fromLocationId: '',
          toLocationId: '',
          fromLocationName: '',
          toLocationName: '',
        }),
    }),
    {
      name: 'stock-transfer-storage',
    }
  )
)
