import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeOrderTax, type TaxLineInput } from "@/utils/tax";

/**
 * Map a seller's items to the tax util's input shape. Per-line net is
 * `costPrice * quantity` (costPrice already nets the per-line discount), so
 * `discount` here is 0 — the order-level additionalDiscount is passed separately.
 * Mirrors the backend PurchaseUtils.applyLineTaxes.
 */
const toPurchaseTaxInputs = (
  items: PurchaseOrderItem[],
): TaxLineInput[] =>
  items.map((i) => ({
    price: i.costPrice,
    quantity: i.quantity,
    discount: 0,
    taxRate: i.taxRate,
    taxType: i.taxType,
  }));

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
  // Product-level purchase tax (drives per-line tax preview).
  purchaseTaxRate?: number;
  purchaseTaxType?: "inclusive" | "exclusive";
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
  price: number; // unit price for the purchase
  discount: number;
  total: number;
  // Calculated fields
  sellingPrice?: number; // for profit calculation
  profit?: number;
  // UOM fields
  purchaseUnitId?: string;
  purchaseUnitName?: string;
  unitName?: string;
  conversionFactor?: number;
  convertedQuantity?: number;
  // Per-line purchase tax (from the product's purchaseTax). 0 when tax inactive.
  taxRate?: number;
  taxType?: "inclusive" | "exclusive";
  // Per-line expiry-batch capture for instant purchases (received on create).
  // Mirrors the order receive flow; only used for expiry-tracked products.
  expiryDate?: string;
  batchNumber?: string;
}

/**
 * Payment info for a seller session
 */
export interface PurchasePaymentInfo {
  paymentMethod: string;
  accountId: string;
  accountName?: string;
  paidAmount: number;
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
  // Supplier discount settings (used for product discount calculation, not sent to API)
  discountType: "percentage" | "fixed";
  discountValue: number;
  additionalDiscount: number; // Fixed amount discount on total
  invoiceAmount: number; // Net amount (can be input or calculated)
  taxAmount: number; // Supplier tax line (manual); added on top of the net. Sent as taxTotal.
  invoiceNumber?: string;
  invoiceDate?: string;
  // Supplier credit balance applied to this PO (advance/refund consumed at creation)
  creditApplied: number;
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
  getSellerNetAmount: (sellerId: string) => number;
  getSellerTax: (sellerId: string) => number;
  /** Tax actually added on top of the net (exclusive lines only). */
  getSellerAddedTax: (sellerId: string) => number;
  /** Tax already baked into the cost (inclusive lines only); informational. */
  getSellerIncludedTax: (sellerId: string) => number;
  getSellerDueAmount: (sellerId: string) => number;
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
    supplierName: string | null,
  ) => void;
  setPurchaseType: (sellerId: string, type: "instant" | "order") => void;
  setPaymentInfo: (sellerId: string, info: PurchasePaymentInfo | null) => void;
  setNotes: (sellerId: string, notes: string) => void;
  setDiscountType: (sellerId: string, type: "percentage" | "fixed") => void;
  setDiscountValue: (sellerId: string, value: number) => void;
  setAdditionalDiscount: (sellerId: string, discount: number) => void;
  setInvoiceAmount: (sellerId: string, amount: number) => void;
  setTax: (sellerId: string, amount: number) => void;
  setInvoiceNumber: (sellerId: string, invoiceNumber: string) => void;
  setInvoiceDate: (sellerId: string, invoiceDate: string) => void;
  setCreditApplied: (sellerId: string, amount: number) => void;

  // Item actions
  addItem: (
    sellerId: string,
    item: Omit<PurchaseOrderItem, "id" | "total">,
  ) => void;
  updateItem: (
    sellerId: string,
    itemId: string,
    data: Partial<Omit<PurchaseOrderItem, "id">>,
  ) => void;
  removeItem: (sellerId: string, itemId: string) => void;
  clearSellerItems: (sellerId: string) => void;

  // Global actions
  clearAll: () => void;
}

/**
 * Calculate total for a purchase item
 */
const calculateItemTotal = (
  item: Omit<PurchaseOrderItem, "id" | "total">,
): number => {
  const subtotal = item.quantity * item.price;
  return Math.max(0, subtotal - ((item.discount * item.quantity) || 0));
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
  discountType: "percentage",
  discountValue: 0,
  additionalDiscount: 0,
  invoiceAmount: 0,
  taxAmount: 0,
  invoiceNumber: "",
  invoiceDate: "",
  creditApplied: 0,
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
        // Sum of all items (quantity * costPrice)
        return seller.items.reduce(
          (sum, item) => sum + item.quantity * item.costPrice,
          0,
        );
      },

      getSellerTotal: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        const subtotal = seller.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
        // additionalDiscount is always fixed amount
        const discount = Math.min(seller.additionalDiscount || 0, subtotal);
        return Math.max(0, subtotal - discount);
      },

      getSellerNetAmount: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        // Tax-correct payable: per-line tax (from each product's purchaseTax) on the
        // discounted net. Mirrors the backend PurchaseUtils.applyLineTaxes.
        return computeOrderTax(
          toPurchaseTaxInputs(seller.items),
          seller.additionalDiscount || 0,
        ).grandTotal;
      },

      getSellerTax: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        return computeOrderTax(
          toPurchaseTaxInputs(seller.items),
          seller.additionalDiscount || 0,
        ).taxTotal;
      },

      getSellerAddedTax: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        return computeOrderTax(
          toPurchaseTaxInputs(seller.items),
          seller.additionalDiscount || 0,
        ).addedTax;
      },

      getSellerIncludedTax: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        return computeOrderTax(
          toPurchaseTaxInputs(seller.items),
          seller.additionalDiscount || 0,
        ).includedTax;
      },

      getSellerDueAmount: (sellerId: string) => {
        const seller = get().sellers.find((s) => s.id === sellerId);
        if (!seller) return 0;
        const netAmount = get().getSellerNetAmount(sellerId);
        const paidAmount = seller.paymentInfo?.paidAmount || 0;
        const creditApplied = seller.creditApplied || 0;
        return Math.max(0, netAmount - paidAmount - creditApplied);
      },

      getGrandTotal: () => {
        return get().sellers.reduce(
          (sum, seller) => sum + get().getSellerNetAmount(seller.id),
          0,
        );
      },

      getTotalItemCount: () => {
        return get().sellers.reduce(
          (sum, seller) => sum + seller.items.length,
          0,
        );
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
          const newIndex = Math.min(
            state.activeSellerIndex,
            newSellers.length - 1,
          );
          return {
            sellers: newSellers,
            activeSellerIndex: newIndex,
          };
        });
      },

      setActiveSeller: (index: number) => {
        set((state) => ({
          activeSellerIndex: Math.min(
            Math.max(0, index),
            state.sellers.length - 1,
          ),
        }));
      },

      // Seller update actions
      setSupplier: (sellerId, supplierId, supplierName) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, supplierId, supplierName }
              : seller,
          ),
        }));
      },

      setPurchaseType: (sellerId, type) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            // When switching to 'order', clear any pre-filled payment so paid amount defaults to 0
            if (type === "order") {
              return { ...seller, purchaseType: type, paymentInfo: null, creditApplied: 0 };
            }
            return { ...seller, purchaseType: type };
          }),
        }));
      },

      setPaymentInfo: (sellerId, info) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId ? { ...seller, paymentInfo: info } : seller,
          ),
        }));
      },

      setNotes: (sellerId, notes) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId ? { ...seller, notes } : seller,
          ),
        }));
      },

      setDiscountType: (sellerId, type) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId ? { ...seller, discountType: type } : seller,
          ),
        }));
      },

      setDiscountValue: (sellerId, value) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, discountValue: value }
              : seller,
          ),
        }));
      },

      setAdditionalDiscount: (sellerId, discount) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            const subtotal = seller.items.reduce(
              (s, item) => s + item.quantity * item.costPrice,
              0,
            );
            const finalDiscount = Math.min(Math.max(0, discount), subtotal);
            // New tax-correct net after the discount change.
            const newNet = computeOrderTax(
              toPurchaseTaxInputs(seller.items),
              finalDiscount,
            ).grandTotal;
            const updatedPaymentInfo = seller.paymentInfo
              ? {
                  ...seller.paymentInfo,
                  paidAmount: Math.max(
                    0,
                    newNet - (seller.creditApplied || 0),
                  ),
                }
              : seller.paymentInfo;
            return {
              ...seller,
              additionalDiscount: finalDiscount,
              paymentInfo: updatedPaymentInfo,
            };
          }),
        }));
      },

      setInvoiceAmount: (sellerId, amount) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            // When invoiceAmount changes, recalculate additionalDiscount
            const subtotal = seller.items.reduce((s, item) => s + (item.quantity * item.costPrice), 0);
            const newDiscount = Math.max(0, subtotal - amount);
            const updatedPaymentInfo = seller.paymentInfo
              ? { ...seller.paymentInfo, paidAmount: Math.max(0, amount + (seller.taxAmount || 0) - (seller.creditApplied || 0)) }
              : seller.paymentInfo;
            return {
              ...seller,
              invoiceAmount: amount,
              additionalDiscount: newDiscount,
              paymentInfo: updatedPaymentInfo,
            };
          }),
        }));
      },

      setTax: (sellerId, amount) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            const taxAmount = Math.max(0, amount || 0);
            // Keep the auto-filled paid amount in sync with the new tax-inclusive net.
            const base = seller.invoiceAmount > 0
              ? seller.invoiceAmount
              : Math.max(0, seller.items.reduce((s, item) => s + (item.quantity * item.costPrice), 0) - (seller.additionalDiscount || 0));
            const updatedPaymentInfo = seller.paymentInfo
              ? { ...seller.paymentInfo, paidAmount: Math.max(0, base + taxAmount - (seller.creditApplied || 0)) }
              : seller.paymentInfo;
            return { ...seller, taxAmount, paymentInfo: updatedPaymentInfo };
          }),
        }));
      },

      setInvoiceNumber: (sellerId, invoiceNumber) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId ? { ...seller, invoiceNumber } : seller,
          ),
        }));
      },

      setInvoiceDate: (sellerId, invoiceDate) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId ? { ...seller, invoiceDate } : seller,
          ),
        }));
      },

      setCreditApplied: (sellerId, amount) => {
        set((state) => ({
          sellers: state.sellers.map((seller) =>
            seller.id === sellerId
              ? { ...seller, creditApplied: Math.max(0, amount) }
              : seller,
          ),
        }));
      },

      // Item actions
      addItem: (sellerId, item) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;

            const total = calculateItemTotal(item);
            let newItems: PurchaseOrderItem[];

            // Check if item with same inventory ID already exists
            const existingIndex = seller.items.findIndex(
              (existing) => existing.inventoryId === item.inventoryId,
            );

            if (existingIndex !== -1) {
              // Replace the existing item
              const updatedItems = [...seller.items];
              updatedItems[existingIndex] = {
                ...item,
                id: seller.items[existingIndex].id,
                total,
              };
              newItems = updatedItems;
            } else {
              // Add new item
              newItems = [...seller.items, { ...item, id: uuidv4(), total }];
            }

            // Tax-correct net for the new item set; keep paidAmount in sync.
            const newNet = computeOrderTax(
              toPurchaseTaxInputs(newItems),
              seller.additionalDiscount || 0,
            ).grandTotal;
            const newPaymentInfo = seller.paymentInfo
              ? {
                  ...seller.paymentInfo,
                  paidAmount: Math.max(0, newNet - (seller.creditApplied || 0)),
                }
              : seller.paymentInfo;

            return { ...seller, items: newItems, paymentInfo: newPaymentInfo };
          }),
        }));
      },

      updateItem: (sellerId, itemId, data) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;

            const newItems = seller.items.map((item) => {
              if (item.id !== itemId) return item;

              const updatedItem = { ...item, ...data };
              // Recalculate total (discount is per-unit, so multiply by quantity)
              updatedItem.total = calculateItemTotal(updatedItem);

              return updatedItem;
            });

            // Tax-correct net for the new item set; keep paidAmount in sync.
            const newNet = computeOrderTax(
              toPurchaseTaxInputs(newItems),
              seller.additionalDiscount || 0,
            ).grandTotal;
            const newPaymentInfo = seller.paymentInfo
              ? {
                  ...seller.paymentInfo,
                  paidAmount: Math.max(0, newNet - (seller.creditApplied || 0)),
                }
              : seller.paymentInfo;

            return { ...seller, items: newItems, paymentInfo: newPaymentInfo };
          }),
        }));
      },

      removeItem: (sellerId, itemId) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            const newItems = seller.items.filter((item) => item.id !== itemId);
            // Tax-correct net for the remaining items; keep paidAmount in sync.
            const newNet = computeOrderTax(
              toPurchaseTaxInputs(newItems),
              seller.additionalDiscount || 0,
            ).grandTotal;
            const newPaymentInfo = seller.paymentInfo
              ? {
                  ...seller.paymentInfo,
                  paidAmount: Math.max(0, newNet - (seller.creditApplied || 0)),
                }
              : seller.paymentInfo;
            return { ...seller, items: newItems, paymentInfo: newPaymentInfo };
          }),
        }));
      },

      clearSellerItems: (sellerId) => {
        set((state) => ({
          sellers: state.sellers.map((seller) => {
            if (seller.id !== sellerId) return seller;
            const clearedPaymentInfo = seller.paymentInfo
              ? { ...seller.paymentInfo, paidAmount: 0 }
              : seller.paymentInfo;
            return { ...seller, items: [], invoiceAmount: 0, paymentInfo: clearedPaymentInfo };
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
    },
  ),
);
