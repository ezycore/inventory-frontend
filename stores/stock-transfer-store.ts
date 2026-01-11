import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export interface TransferItem {
  id: string
  productId: string
  variantId: string | null
  from_locationId: string
  to_locationId: string
  transfer_quantity: number
  // Display names
  product_name: string
  from_location_name: string
  to_location_name: string
  variant_attributes?: { name?: string;[key: string]: any } | null
  notes?: string
}

interface TransferStore {
  items: TransferItem[]
  addItem: (item: Omit<TransferItem, 'id'>) => void
  updateItem: (id: string, updates: Partial<Omit<TransferItem, 'id'>>) => void
  removeItem: (id: string) => void
  clearAll: () => void
}

export const useTransferStore = create<TransferStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Check for duplicate (same product + variant + from + to location)
          const existingIndex = state.items.findIndex(
            (existing) =>
              existing.productId === item.productId &&
              existing.from_locationId === item.from_locationId &&
              existing.to_locationId === item.to_locationId &&
              (existing.variantId || null) === (item.variantId || null)
          )

          if (existingIndex !== -1) {
            // Replace existing item
            const newItems = [...state.items]
            newItems[existingIndex] = { ...item, id: newItems[existingIndex].id }
            return { items: newItems }
          } else {
            // Add new item
            return { items: [...state.items, { ...item, id: uuid() }] }
          }
        }),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'stock-transfer-storage',
    }
  )
)
