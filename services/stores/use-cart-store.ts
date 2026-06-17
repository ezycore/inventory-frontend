import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Client-side cart (Zustand + localStorage). There is no backend cart in v1;
 * the cart is re-validated server-side at checkout (E2). A cart belongs to one
 * store — switching stores resets it.
 */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  maxQty: number;
}

interface CartState {
  storeSlug: string | null;
  items: CartItem[];
  setStore: (storeSlug: string) => void;
  addItem: (
    storeSlug: string,
    item: Omit<CartItem, "quantity">,
    qty?: number,
  ) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      storeSlug: null,
      items: [],

      setStore: (storeSlug) =>
        set((s) =>
          s.storeSlug === storeSlug ? s : { storeSlug, items: [] },
        ),

      addItem: (storeSlug, item, qty = 1) =>
        set((s) => {
          // Different store → start a fresh cart.
          const base = s.storeSlug === storeSlug ? s.items : [];
          const existing = base.find((i) => i.productId === item.productId);
          const cap = item.maxQty > 0 ? item.maxQty : Infinity;
          let items: CartItem[];
          if (existing) {
            items = base.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: Math.min(cap, i.quantity + qty) }
                : i,
            );
          } else {
            items = [...base, { ...item, quantity: Math.min(cap, qty) }];
          }
          return { storeSlug, items };
        }),

      updateQty: (productId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId
                ? {
                    ...i,
                    quantity: Math.max(
                      1,
                      Math.min(i.maxQty > 0 ? i.maxQty : Infinity, qty),
                    ),
                  }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "easystock-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
