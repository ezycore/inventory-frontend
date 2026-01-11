import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface AdjustmentItem {
  id: string; // local ID
  productId: string;
  variantId?: string | null;
  locationId: string;
  old_quantity: number;
  new_quantity: number;
  notes?: string;
  // Display fields
  product_name: string;
  variant_attributes?: Record<string, any> | null;
  location_name: string;
}

interface StockAdjustmentStore {
  items: AdjustmentItem[];
  addItem: (item: Omit<AdjustmentItem, 'id'>) => void;
  updateItem: (id: string, data: Partial<AdjustmentItem>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export const useStockAdjustmentStore = create<StockAdjustmentStore>()(persist(
  (set) => ({
    items: [],

    addItem: (item) =>
      set((state) => {
        // Check if item with same product, variant, and location already exists
        const existingIndex = state.items.findIndex(
          (existing) =>
            existing.productId === item.productId &&
            existing.locationId === item.locationId &&
            (existing.variantId || null) === (item.variantId || null)
        );

        if (existingIndex !== -1) {
          // Replace the existing item (keep the last one)
          const updatedItems = [...state.items];
          updatedItems[existingIndex] = { ...item, id: state.items[existingIndex].id };
          return { items: updatedItems };
        }

        // Add new item if not exists
        return { items: [...state.items, { ...item, id: uuidv4() }] };
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

    clearAll: () => set({ items: [] }),
  }),
  {
    name: 'stock-adjustment-storage', // localStorage key
  }
));
