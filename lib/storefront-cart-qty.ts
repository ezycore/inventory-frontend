// coding-standard: maintained

/**
 * How many of one line a shopper may put in the browser cart.
 *
 * **The whole point of this file is that `0` and "no limit" are different
 * answers.** They used to be the same number: every add-to-cart site passed
 * `maxQty: canBackorder ? 0 : availableQuantity`, and the cart store read any
 * non-positive cap as `Infinity`. So a sold-out line — which also reports `0` —
 * came out uncapped, and the shopper could raise it to any quantity before
 * checkout refused the order. The backend's cart mirror had the identical bug on
 * the restore/merge path (`CART_MAX_QTY_UNCAPPED` in `storefront-cart.service.ts`),
 * which is why the sentinel is negative on both sides of the wire.
 *
 * Every producer of a `CartItem` uses `cartLineCap`; the store is the only
 * consumer and uses `resolveCartCap`. Neither rule is re-derived anywhere else.
 */

/** No sellable ceiling — a backorder product. Negative, never `0`. */
export const CART_UNCAPPED = -1;

/**
 * The `maxQty` to store on a cart line.
 *
 * `available` is the sellable quantity the catalogue reported; `canBackorder` is
 * the product's `outOfStockBehavior === "backorder"`, which stays buyable past
 * on-hand stock exactly as it does on the product page.
 */
export function cartLineCap(
  available: number | null | undefined,
  canBackorder: boolean,
): number {
  if (canBackorder) return CART_UNCAPPED;
  return Math.max(0, Math.floor(available ?? 0));
}

/**
 * A stored `maxQty` as a usable ceiling: `Infinity` when uncapped, the number
 * itself otherwise — including `0`, which correctly refuses the line.
 */
export function resolveCartCap(maxQty: number): number {
  return maxQty < 0 ? Infinity : maxQty;
}
