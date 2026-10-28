// coding-standard: maintained
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/services/stores/use-cart-store";

/**
 * The one line a shopper pressed **Buy now** on — checked out on its own,
 * never added to the cart.
 *
 * Buy now used to add the line to the cart and open checkout, so a shopper with
 * anything already in their basket ordered all of it. On a COD store that is a
 * parcel refused at the door, with the courier paid both ways. The cart is now
 * left exactly as it was, whether this order is placed or not.
 *
 * **`sessionStorage`, not `localStorage`:** a reload of the checkout must keep
 * the line, but a new tab — or tomorrow — must not inherit one the shopper
 * abandoned. Read it through `useBuyNowLine` (`services/storefront/use-buy-now.ts`),
 * which also requires the checkout URL to say it is a buy-now checkout, so a
 * stale line here never replaces the cart on a plain `/checkout`.
 */
interface BuyNowState {
  storeSlug: string | null;
  line: CartItem | null;
  start: (storeSlug: string, line: CartItem) => void;
  end: () => void;
}

export const useBuyNowStore = create<BuyNowState>()(
  persist(
    (set) => ({
      storeSlug: null,
      line: null,
      start: (storeSlug, line) => set({ storeSlug, line }),
      end: () => set({ storeSlug: null, line: null }),
    }),
    {
      name: "ezy-sf-buy-now",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
