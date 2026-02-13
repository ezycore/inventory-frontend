import { DiscountType } from "@/utils/discount";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PurchaseOrderStatus } from "@/types";

/**
 * Supplier option with metadata
 */
export interface SupplierSelectOption {
  value: string;
  label: string;
  phone?: string;
  email?: string;
}

/**
 * Product option with pricing metadata for purchases
 */
export interface PurchaseProductSelectOption {
  value: string; // inventoryId
  label: string;
  costPrice: number;
  sellingPrice: number;
  currentQuantity: number;
  productId: string;
  variantId: string | null;
  // UOM fields
  hasUOM?: boolean;
  purchaseUnitId?: string;
  purchaseUnitName?: string;
  conversionFactor?: number;
}

/**
 * Purchase item in the order list
 */
export interface PurchaseOrderItem {
  id: string; // local ID for tracking
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName: string;
  quantity: number;
  costPrice: number; // purchase price (what we pay)
  unitPrice: number; // unit price for the purchase
  discount: number;
  total: number;
  // Calculated fields
  sellingPrice?: number; // for profit calculation
  profit?: number;
  // UOM fields
  purchaseUnitId?: string;
  purchaseUnitName?: string;
  conversionFactor?: number;
  convertedQuantity?: number;
}

/**
 * Payment info for a seller session
 */
export interface PurchasePaymentInfo {
  paymentMethod: string;
  accountId: string;
  accountName?: string;
  amount: number;
}

/**
 * A seller session representing one supplier's items
 */
export interface SellerSession {
  id: string;
  supplierId: string | null;
  supplierName: string | null;
  items: PurchaseOrderItem[];
  purchaseType: "instant" | "order"; // instant = received, order = ordered
  paymentInfo: PurchasePaymentInfo | null;
  notes: string;
  additionalDiscount: number;
  discountType: DiscountType;
  invoiceNumber?: string;
  invoiceDate?: string;
}

/**
 * Account option for payment
 */
export interface AccountSelectOption {
  value: string;
  label: string;
  isDefault?: boolean;
}

/**
 * Purchase page store state
 */
interface PurchasePageStore {
  // Seller sessions
  sellers: SellerSession[];

  // Active seller index
  activeSellerIndex: number;

  // Computed values
  getSellerSubtotal: (sellerId: string) => number;
  getSellerTotal: (sellerId: string) => number;
  getGrandTotal: () => number;
  getTotalItemCount: () => number;

  // Session actions
  addSeller: () => string; // Returns new seller ID
  removeSeller: (sellerId: string) => void;
  setActiveSeller: (index: number) => void;

  // Seller update actions
  setSupplier: (
    sellerId: string,
    supplierId: string | null,
    supplierName: string | null
  ) => void;
  setPurchaseType: (sellerId: string, type: "instant" | "order") => void;
  setPaymentInfo: (sellerId: string, info: PurchasePaymentInfo | null) => void;
  setNotes: (sellerId: string, notes: string) => void;
  setAdditionalDiscount: (sellerId: string, discount: number) => void;
  setDiscountType: (sellerId: string, type: DiscountType) => void;
  setInvoiceNumber: (sellerId: string, invoiceNumber: string) => void;
  setInvoiceDate: (sellerId: string, invoiceDate: string) => void;

  // Item actions
  addItem: (sellerId: string, item: Omit<PurchaseOrderItem, "id" | "total">) => void;
  updateItem: (
    sellerId: string,
    itemId: string,
    data: Partial<Omit<PurchaseOrderItem, "id">>
  ) => void;
  removeItem: (sellerId: string, itemId: string) => void;
  clearSellerItems: (sellerId: string) => void;

  // Global actions
  clearAll: () => void;
}

/**
 * Calculate total for a purchase item
 */
const calculateItemTotal = (item: Omit<PurchaseOrderItem, "id" | "total">): number => {
  const subtotal = item.quantity * item.unitPrice;
  return Math.max(0, subtotal - (item.discount || 0));
};

/**
 * Create an empty seller session
 */
const createEmptySeller = (): SellerSession => ({
  id: uuidv4(),
  supplierId: null,
  supplierName: null,
  items: [],
  purchaseType: "instant",
  paymentInfo: null,
  notes: "",
  additionalDiscount: 0,
  discountType: "fixed",
  invoiceNumber: "",
  invoiceDate: "",
});

export const usePurchasePageStore = create<PurchasePageStore>()(
  persist(
    (set, get) => ({
      sellers: [createEmptySeller()],
      activeSellerIndex: 0,

      // Computed values
      getSellerSubtotal: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        return seller.items.reduce((sum, item) => sum + item.total, 0);
      },

      getSellerTotal: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        const subtotal = seller.items.reduce((sum, item) => sum + item.total, 0);
        const discountValue = seller.additionalDiscount || 0;
        
        // Calculate discount based on type
        let discountAmount = 0;
        if (seller.discountType === "percentage") {
          discountAmount = (subtotal * discountValue) / 100;
        } else {
          discountAmount = discountValue;
        }
        
        return Math.max(0, subtotal - discountAmount);
      },

      getGrandTotal: () => {
        return get().sellers.reduce((sum, seller) => {
          const subtotal = seller.items.reduce((s, item) => s + item.total, 0);
          const discountValue = seller.additionalDiscount || 0;
          
          // Calculate discount based on type
          let discountAmount = 0;
          if (seller.discountType === "percentage") {
            discountAmount = (subtotal * discountValue) / 100;
          } else {
            discountAmount = discountValue;
          }
          
          return sum + Math.max(0, subtotal - discountAmount);
        }, 0);
      },

      getTotalItemCount: () => {
        return get().sellers.reduce((sum, seller) => sum + seller.items.length, 0);
      },

      // Session actions
      addSeller: () => {
        const newSeller = createEmptySeller();
        set((state) => ({
          sellers: [...state.sellers, newSeller],
          activeSellerIndex: state.sellers.length, // Switch to new seller
        }));
        return newSeller.id;
      },

      removeSeller: (sellerId: string) => {
        set((state) => {
          const newSellers = state.sellers.filter((s) => s.id !== sellerId);
          // Ensure at least one seller exists
          if (newSellers.length === 0) {
            return {
              sellers: [createEmptySeller()],
              activeSellerIndex: 0,
            };
          }
          // Adjust active index if needed
          const newIndex = Math.min(state.activeSellerIndex, newSellers.length - 1);
          return {
            sellers: newSellers,
            activeSellerIndex: newIndex,
          };
        });
      },

      setActiveSeller: (index: number) => {
        set((state) => ({
          activeSellerIndex: Math.min(Math.max(0, index), state.sellers.length - 1),
        }));
      },

      // Seller update actions
      setSupplier: (sellerId, supplierId, supplierName) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, supplierId, supplierName }
              : seller
          ),
        }));
      },

      setPurchaseType: (sellerId, type) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, purchaseType: type }
              : seller
          ),
        }));
      },

      setPaymentInfo: (sellerId, info) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, paymentInfo: info }
              : seller
          ),
        }));
      },

      setNotes: (sellerId, notes) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, notes }
              : seller
          ),
        }));
      },

      setAdditionalDiscount: (sellerId, discount) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, additionalDiscount: discount }
              : seller
          ),
        }));
      },

      setDiscountType: (sellerId, type) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, discountType: type }
              : seller
          ),
        }));
      },

      setInvoiceNumber: (sellerId, invoiceNumber) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, invoiceNumber }
              : seller
          ),
        }));
      },

      setInvoiceDate: (sellerId, invoiceDate) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, invoiceDate }
              : seller
          ),
        }));
      },

      // Item actions
      addItem: (sellerId, item) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;

            const total = calculateItemTotal(item);

            // Check if item with same inventory ID already exists
            const existingIndex = seller.items.findIndex(
              (existing) => existing.inventoryId === item.inventoryId
            );

            if (existingIndex !== -1) {
              // Replace the existing item
              const updatedItems = [...seller.items];
              updatedItems[existingIndex] = {
                ...item,
                id: seller.items[existingIndex].id,
                total,
              };
              return { ...seller, items: updatedItems };
            }

            // Add new item
            return {
              ...seller,
              items: [...seller.items, { ...item, id: uuidv4(), total }],
            };
          }),
        }));
      },

      updateItem: (sellerId, itemId, data) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;

            return {
              ...seller,
              items: seller.items.map((item) => {
                if (item.id !== itemId) return item;

                const updatedItem = { ...item, ...data };
                // Recalculate total
                updatedItem.total =
                  updatedItem.quantity * updatedItem.unitPrice -
                  (updatedItem.discount || 0);

                return updatedItem;
              }),
            };
          }),
        }));
      },

      removeItem: (sellerId, itemId) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            return {
              ...seller,
              items: seller.items.filter((item) => item.id !== itemId),
            };
          }),
        }));
      },

      clearSellerItems: (sellerId) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            return { ...seller, items: [] };
          }),
        }));
      },

      // Global actions
      clearAll: () => {
        set({
          sellers: [createEmptySeller()],
          activeSellerIndex: 0,
        });
      },
    }),
    {
      name: "purchase-page-storage", // localStorage key
    }
  )
);
