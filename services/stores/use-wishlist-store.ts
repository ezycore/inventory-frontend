// coding-standard: maintained
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Client-side wishlist (Zustand + localStorage), mirroring the cart's model:
 * no backend in v1, one store per wishlist — switching stores resets it. Items
 * snapshot the product's card data at save time so the account Wishlist grid
 * renders without a catalog round-trip.
 */
export interface WishItem {
  productId: string;
  slug: string;
  name: string;
  price: number | null;
  compareAtPrice?: number | null;
  image?: string;
  /** Variable products can't be moved to cart blindly — send to the PDP. */
  hasVariants?: boolean;
  /** Stock at save time — caps "Move to cart" (backend re-validates at order). */
  availableQuantity?: number;
}

interface WishlistState {
  storeSlug: string | null;
  items: WishItem[];
  toggle: (storeSlug: string, item: WishItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      storeSlug: null,
      items: [],

      toggle: (storeSlug, item) =>
        set((s) => {
          const base = s.storeSlug === storeSlug ? s.items : [];
          const exists = base.some((i) => i.productId === item.productId);
          return {
            storeSlug,
            items: exists
              ? base.filter((i) => i.productId !== item.productId)
              : [...base, item],
          };
        }),

      remove: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "easystock-wishlist",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
