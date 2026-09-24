// coding-standard: maintained
import { cartLineKey, useCartStore, type CartItem } from "@/services/stores/use-cart-store";

/**
 * Call `onAdd` once for every increase in the storefront cart — the ONE definition of "an
 * add-to-cart" for every measurement tool (Meta `AddToCart`, GA4 `add_to_cart`).
 *
 * **Why a cart subscription rather than the call sites.** `addItem` is called from the search
 * grid, the card quick-buy and the product page today, and the set grows — a new button would
 * silently stop reporting with nothing failing. One subscription cannot be forgotten.
 *
 * It watches a *transition*, not state: previous is diffed against next and only the increase is
 * reported, for the quantity actually added rather than the line's new total. Decreases and
 * removals report nothing. A bulk arrival into an empty cart — `restore()` from an abandoned-cart
 * recovery link — is not an add either: reporting N adds for items chosen days ago would invent a
 * burst of intent that never happened.
 *
 * Returns the unsubscribe function, for an effect's cleanup.
 */
export const subscribeCartAdds = (
  onAdd: (item: CartItem, quantityAdded: number) => void,
): (() => void) => {
  let previous = useCartStore.getState().items;

  return useCartStore.subscribe((state) => {
    const next = state.items;
    const before = previous;
    previous = next;

    if (before.length === 0 && next.length > 1) return;

    for (const item of next) {
      const key = cartLineKey(item);
      const match = before.find((i) => cartLineKey(i) === key);
      const added = item.quantity - (match?.quantity ?? 0);
      if (added > 0) onAdd(item, added);
    }
  });
};
