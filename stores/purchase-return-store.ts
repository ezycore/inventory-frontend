import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export interface PurchaseReturnItem {
  id: string
  productId: string
  variantId: string | null
  locationId: string
  returned_quantity: number
  // Display names
  product_name: string
  location_name: string
  variant_attributes?: { name?: string;[key: string]: any } | null
  notes?: string
}

interface PurchaseReturnStore {
  items: PurchaseReturnItem[]
  addItem: (item: Omit<PurchaseReturnItem, 'id'>) => void
  updateItem: (id: string, updates: Partial<Omit<PurchaseReturnItem, 'id'>>) => void
  removeItem: (id: string) => void
  clearAll: () => void
}

export const usePurchaseReturnStore = create<PurchaseReturnStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Check for duplicate (same product + variant + location)
          const existingIndex = state.items.findIndex(
            (existing) =>
              existing.productId === item.productId &&
              existing.locationId === item.locationId &&
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
      name: 'purchase-return-storage',
    }
  )
)
