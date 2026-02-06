import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export interface PurchaseOrderLineItem {
  id: string; // local ID
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  total: number;
  // Display fields
  productName: string;
  variantName?: string | null;
  locationId: string;
  locationName: string;
}

interface PurchaseOrderStore {
  // Order header
  supplierId: string | null;
  supplierName: string | null;
  supplierDiscount: number;
  locationId: string | null;
  locationName: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  taxTotal: number;
  notes: string;

  // Order items
  items: PurchaseOrderLineItem[];

  // Calculated totals
  subtotal: number;
  grandTotal: number;

  // Actions - Header
  setSupplier: (
    id: string | null,
    name: string | null,
    defaultDiscount?: number
  ) => void;
  setLocation: (id: string | null, name: string | null) => void;
  setInvoiceNumber: (value: string) => void;
  setInvoiceDate: (value: string) => void;
  setDiscountType: (type: "percentage" | "fixed") => void;
  setDiscountValue: (value: number) => void;
  setTaxTotal: (value: number) => void;
  setNotes: (value: string) => void;

  // Actions - Items
  addItem: (item: Omit<PurchaseOrderLineItem, "id" | "total">) => void;
  updateItem: (id: string, data: Partial<PurchaseOrderLineItem>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;

  // Actions - Full Reset
  clearAll: () => void;

  // Helpers
  recalculateTotals: () => void;
}

function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  discount: number
): number {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discount) / 100;
  return Math.round((subtotal - discountAmount) * 100) / 100;
}

function calculateOrderTotals(
  items: PurchaseOrderLineItem[],
  discountType: "percentage" | "fixed",
  discountValue: number,
  taxTotal: number
): { subtotal: number; grandTotal: number } {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  let orderDiscount = 0;
  if (discountType === "percentage") {
    orderDiscount = (subtotal * discountValue) / 100;
  } else {
    orderDiscount = discountValue;
  }

  const grandTotal =
    Math.round((subtotal - orderDiscount + taxTotal) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    grandTotal,
  };
}

const initialState = {
  supplierId: null,
  supplierName: null,
  supplierDiscount: 0,
  locationId: null,
  locationName: null,
  invoiceNumber: "",
  invoiceDate: "",
  discountType: "percentage" as const,
  discountValue: 0,
  taxTotal: 0,
  notes: "",
  items: [],
  subtotal: 0,
  grandTotal: 0,
};

export const usePurchaseOrderStore = create<PurchaseOrderStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSupplier: (id, name, defaultDiscount = 0) =>
        set({
          supplierId: id,
          supplierName: name,
          supplierDiscount: defaultDiscount,
          // Apply supplier discount to existing items without explicit discount
          items: get().items.map((item) => {
            if (item.discount === get().supplierDiscount) {
              const newDiscount = defaultDiscount;
              return {
                ...item,
                discount: newDiscount,
                total: calculateItemTotal(
                  item.quantity,
                  item.unitPrice,
                  newDiscount
                ),
              };
            }
            return item;
          }),
        }),

      setLocation: (id, name) =>
        set({
          locationId: id,
          locationName: name,
          // Update location for all items
          items: get().items.map((item) => ({
            ...item,
            locationId: id || "",
            locationName: name || "",
          })),
        }),

      setInvoiceNumber: (value) => set({ invoiceNumber: value }),
      setInvoiceDate: (value) => set({ invoiceDate: value }),
      setDiscountType: (type) => {
        set({ discountType: type });
        get().recalculateTotals();
      },
      setDiscountValue: (value) => {
        set({ discountValue: value });
        get().recalculateTotals();
      },
      setTaxTotal: (value) => {
        set({ taxTotal: value });
        get().recalculateTotals();
      },
      setNotes: (value) => set({ notes: value }),

      addItem: (item) =>
        set((state) => {
          // Use supplier discount as default if no discount specified
          const discount =
            item.discount !== undefined ? item.discount : state.supplierDiscount;
          const total = calculateItemTotal(item.quantity, item.unitPrice, discount);

          // Check if item with same product/variant already exists
          const existingIndex = state.items.findIndex(
            (existing) =>
              existing.productId === item.productId &&
              (existing.variantId || null) === (item.variantId || null)
          );

          let newItems: PurchaseOrderLineItem[];
          if (existingIndex !== -1) {
            // Replace existing item
            newItems = [...state.items];
            newItems[existingIndex] = {
              ...item,
              id: state.items[existingIndex].id,
              discount,
              total,
            };
          } else {
            // Add new item
            newItems = [...state.items, { ...item, id: uuidv4(), discount, total }];
          }

          const { subtotal, grandTotal } = calculateOrderTotals(
            newItems,
            state.discountType,
            state.discountValue,
            state.taxTotal
          );

          return { items: newItems, subtotal, grandTotal };
        }),

      updateItem: (id, data) =>
        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.id === id) {
              const updated = { ...item, ...data };
              // Recalculate total if quantity, price, or discount changed
              if (
                data.quantity !== undefined ||
                data.unitPrice !== undefined ||
                data.discount !== undefined
              ) {
                updated.total = calculateItemTotal(
                  updated.quantity,
                  updated.unitPrice,
                  updated.discount
                );
              }
              return updated;
            }
            return item;
          });

          const { subtotal, grandTotal } = calculateOrderTotals(
            newItems,
            state.discountType,
            state.discountValue,
            state.taxTotal
          );

          return { items: newItems, subtotal, grandTotal };
        }),

      removeItem: (id) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id);
          const { subtotal, grandTotal } = calculateOrderTotals(
            newItems,
            state.discountType,
            state.discountValue,
            state.taxTotal
          );
          return { items: newItems, subtotal, grandTotal };
        }),

      clearItems: () => set({ items: [], subtotal: 0, grandTotal: 0 }),

      clearAll: () => set(initialState),

      recalculateTotals: () =>
        set((state) => {
          const { subtotal, grandTotal } = calculateOrderTotals(
            state.items,
            state.discountType,
            state.discountValue,
            state.taxTotal
          );
          return { subtotal, grandTotal };
        }),
    }),
    {
      name: "purchase-order-storage",
    }
  )
);
