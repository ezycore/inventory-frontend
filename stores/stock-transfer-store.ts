import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export interface TransferItem {
 id: string
 product_id: string
 variant_id: string | null
 from_location_id: string
 to_location_id: string
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
       existing.product_id === item.product_id &&
       existing.from_location_id === item.from_location_id &&
       existing.to_location_id === item.to_location_id &&
       (existing.variant_id || null) === (item.variant_id || null)
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
