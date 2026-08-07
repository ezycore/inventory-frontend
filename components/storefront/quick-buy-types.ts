// coding-standard: maintained
import type { CartItem } from "@/services/stores/use-cart-store";

/**
 * One resolved purchase intent from a quick-buy surface — a cart line plus the
 * quantity chosen alongside it.
 *
 * It exists as its own module so `card-buy-actions.tsx` (which owns the cart
 * write and the post-add navigation) and `quick-buy-sheet.tsx` (which resolves
 * the variant) can agree on the shape without importing each other. `qty` is
 * separate from `CartItem.quantity` because the store's `addItem` takes the
 * quantity as its own argument, so a line is described before it has one.
 */
export type QuickBuyLine = Omit<CartItem, "quantity"> & { qty: number };
