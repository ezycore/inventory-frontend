import { DiscountType, calculateLineTotal } from "@/utils/discount";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CustomerApiItem, ExtractedCustomer, OrderItem } from './../../components/sales/types';

/**
 * Customer option with discount metadata
 */
export interface CustomerSelectOption {
  value: string;
  label: string;
  defaultDiscountValue: number;
  defaultDiscountType: DiscountType;
}

/**
 * Product option with pricing and discount metadata
 */
export interface ProductSelectOption {
  value: string; // inventoryId
  label: string;
  price: number;
  costPrice: number;
  availableQuantity: number;
  productDiscountType: DiscountType;
  productDiscountValue: number;
  productId: string;
  variantId: string | null;
}

/**
 * Sale item in the order list
 */
export type SellOrderItem = OrderItem & {
  id: string; // local ID for tracking
  discountType: DiscountType;
  discountValue: number;
  salePrice: number;
  total: number;
  availableQuantity: number;
}

/**
 * Complete order state with customer and items
 */
interface SellPageStore {
  // Customer details
  customerId: string | null;
  customerName: string | null;

  // Order-level discount (from customer)
  orderDiscountType: DiscountType;
  orderDiscountValue: number;

  // Additional discount (for rounding, applied after all calculations)
  additionalDiscount: number;

  // Notes
  notes: string;

  // Items in the order
  items: SellOrderItem[];

  // Computed values
  getTotalCostPrice: () => number;
  getTotalSalePrice: () => number;

  // Actions
  setCustomer: (CustomerApiItem: ExtractedCustomer) => void;
  setOrderDiscount: (discountType: DiscountType, discountValue: number) => void;
  setAdditionalDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  addItem: (item: Omit<SellOrderItem, "id" | "total">) => void;
  updateItem: (id: string, data: Partial<Omit<SellOrderItem, "id">>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  clearItems: () => void;
}

/**
 * Calculate total for a line item
 */
const calculateItemTotal = (
  item: Omit<SellOrderItem, "id" | "total">,
): number => {
  return calculateLineTotal(
    item.quantity,
    item.salePrice, // Use sale price which already has discount applied
    "fixed", // No additional discount on the total
    0,
  );
};

export const useSellPageStore = create<SellPageStore>()(
  persist(
    (set, get) => ({
      customerId: null,
      customerName: null,
      orderDiscountType: "percentage",
      orderDiscountValue: 0,
      additionalDiscount: 0,
      notes: "",
      items: [],

      getTotalCostPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.costPrice * item.quantity,
          0,
        );
      },

      getTotalSalePrice: () => {
        const itemsTotal = get().items.reduce(
          (sum, item) => sum + item.total,
          0,
        );
        const additionalDiscount = get().additionalDiscount;
        return Math.max(0, itemsTotal - additionalDiscount);
      },

      setCustomer: (customer) =>
        set({
          customerId: customer.value,
          customerName: customer.label,
          orderDiscountType: customer.discountType,
          orderDiscountValue: customer.discountValue,
        }),

      setOrderDiscount: (discountType, discountValue) =>
        set({
          orderDiscountType: discountType,
          orderDiscountValue: discountValue,
        }),

      setAdditionalDiscount: (discount) =>
        set({ additionalDiscount: discount }),

      setNotes: (notes) => set({ notes }),

      addItem: (item) =>
        set((state) => {
          const total = item.quantity * item.salePrice;

          // Check if item with same inventory ID already exists
          const existingIndex = state.items.findIndex(
            (existing) => existing.inventoryId === item.inventoryId,
          );

          if (existingIndex !== -1) {
            // Replace the existing item
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...item,
              id: state.items[existingIndex].id,
              total,
            };
            return { items: updatedItems };
          }

          // Add new item
          return {
            items: [...state.items, { ...item, id: uuidv4(), total }],
          };
        }),

      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;

            const updatedItem = { ...item, ...data };
            // Recalculate total
            updatedItem.total = updatedItem.quantity * updatedItem.salePrice;

            return updatedItem;
          }),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearAll: () =>
        set({
          customerId: null,
          customerName: null,
          orderDiscountType: "percentage",
          orderDiscountValue: 0,
          additionalDiscount: 0,
          notes: "",
          items: [],
        }),

      clearItems: () => set({ items: [] }),
    }),
    {
      name: "sell-page-storage", // localStorage key
    },
  ),
);
