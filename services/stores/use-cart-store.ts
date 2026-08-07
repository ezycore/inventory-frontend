// coding-standard: maintained
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { resolveCartCap } from "@/lib/storefront-cart-qty";

/**
 * Client-side cart (Zustand + localStorage). There is no backend cart in v1;
 * the cart is re-validated server-side at checkout (E2). A cart belongs to one
 * store — switching stores resets it.
 */
export interface CartItem {
  productId: string;
  /** Set for variable products — each variant is its own cart line. */
  variantId?: string;
  /** Human label of the picked variant, e.g. "1L" / "Red / XL". */
  variantLabel?: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  /**
   * Sellable ceiling for this line. `0` = sold out; NEGATIVE = uncapped
   * (backorder). Build it with `cartLineCap`, read it with `resolveCartCap` —
   * never compare it by hand (`lib/storefront-cart-qty.ts` says why).
   */
  maxQty: number;
}

/** Cart line identity — a product and one of its variants are distinct lines. */
export const cartLineKey = (i: { productId: string; variantId?: string }) =>
  i.variantId ? `${i.productId}:${i.variantId}` : i.productId;

interface CartState {
  storeSlug: string | null;
  items: CartItem[];
  setStore: (storeSlug: string) => void;
  addItem: (
    storeSlug: string,
    item: Omit<CartItem, "quantity">,
    qty?: number,
  ) => void;
  updateQty: (lineKey: string, qty: number) => void;
  removeItem: (lineKey: string) => void;
  /**
   * Replace the whole cart in one write — used only by the abandoned-cart
   * recovery link, which arrives with a server-rebuilt cart. One `set` rather
   * than `clear()` + N `addItem()`s so subscribers (the server mirror) see a
   * single change instead of N.
   */
  restore: (storeSlug: string, items: CartItem[]) => void;
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
          const key = cartLineKey(item);
          const existing = base.find((i) => cartLineKey(i) === key);
          const cap = resolveCartCap(item.maxQty);
          // A zero cap is a sold-out line, not an unlimited one — adding it
          // would put a `quantity: 0` row in the cart that renders as a line the
          // shopper cannot remove by decrementing. Refuse it here; the CTA is
          // already disabled on every surface, so this is the backstop.
          if (cap <= 0) return s;
          let items: CartItem[];
          if (existing) {
            items = base.map((i) =>
              cartLineKey(i) === key
                ? { ...i, quantity: Math.min(cap, i.quantity + qty) }
                : i,
            );
          } else {
            items = [...base, { ...item, quantity: Math.min(cap, qty) }];
          }
          return { storeSlug, items };
        }),

      updateQty: (lineKey, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              cartLineKey(i) === lineKey
                ? {
                    ...i,
                    quantity: Math.max(1, Math.min(resolveCartCap(i.maxQty), qty)),
                  }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (lineKey) =>
        set((s) => ({
          items: s.items.filter((i) => cartLineKey(i) !== lineKey),
        })),

      restore: (storeSlug, items) => set({ storeSlug, items }),

      clear: () => set({ items: [] }),
    }),
    {
      name: "easystock-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
