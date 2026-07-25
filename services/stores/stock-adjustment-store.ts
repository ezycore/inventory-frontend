import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

/** One lot a decrease of an expiry-tracked product draws stock out of. */
export interface BatchDraw {
  batchId: string;
  quantity: number;
  /** Display only — the lot's expiry, so the review table can name it. */
  expiryDate?: string | null;
  batchNumber?: string;
  /** Display only — the draw is a write-off of stock that had already gone off. */
  expired?: boolean;
}

export interface AdjustmentItem {
  id: string; // local ID
  inventoryId: string; // the inventory record _id
  productId: string;
  variantId?: string | null;
  currentQuantity: number;
  newQuantity: number; // always in base units
  notes?: string;
  // The row's existing cost basis at add time (0/undefined ⇒ no basis yet)
  rowCostPrice?: number;
  // Cost for the added units, captured only when the row has no cost basis yet
  costPrice?: number;
  // Display fields
  product_name: string;
  price: number;
  // UOM conversion fields (only when product supports UOM)
  enableUOMConversion?: boolean;
  conversionFactor?: number;
  purchaseUnitName?: string;
  baseUnitName?: string;
  // Expiry-batch capture (only for expiry-tracked products on a stock increase).
  // `expiryDate` opens a new lot; `batchId` adds into an existing one — never both.
  hasExpiry?: boolean;
  expiryDate?: string;
  batchNumber?: string;
  batchId?: string;
  // Which lots a decrease of an expiry-tracked product comes out of. Must sum to
  // currentQuantity - newQuantity.
  batchDraws?: BatchDraw[];
}

/** Which unit a UOM product's quantity input opens in by default. */
export type AdjustDefaultUnit = 'base' | 'purchase';

interface StockAdjustmentStore {
  items: AdjustmentItem[];
  reason: string;
  // User preference: default input unit for UOM products. Remembered across sessions,
  // NOT cleared by clearAll (it's a preference, not adjustment data).
  defaultUnit: AdjustDefaultUnit;
  addItem: (item: Omit<AdjustmentItem, 'id'>) => void;
  updateItem: (id: string, data: Partial<AdjustmentItem>) => void;
  removeItem: (id: string) => void;
  setReason: (reason: string) => void;
  setDefaultUnit: (unit: AdjustDefaultUnit) => void;
  clearAll: () => void;
}

export const useStockAdjustmentStore = create<StockAdjustmentStore>()(persist(
  (set) => ({
    items: [],
    reason: '',
    defaultUnit: 'base',

    addItem: (item) =>
      set((state) => {
        // Check if item with same inventoryId already exists
        const existingIndex = state.items.findIndex(
          (existing) => existing.inventoryId === item.inventoryId
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

    setReason: (reason) => set({ reason }),

    setDefaultUnit: (unit) => set({ defaultUnit: unit }),

    clearAll: () => set({ items: [], reason: '' }),
  }),
  {
    name: 'stock-adjustment-storage', // localStorage key
  }
));
