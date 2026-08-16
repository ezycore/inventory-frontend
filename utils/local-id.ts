// coding-standard: maintained

/**
 * A fresh id for a row the browser just created — a receipt header line, a
 * homepage product row — where the id only has to be unique **within one
 * document** and never leaves it. It is what survives a reorder, so the list
 * can be re-sorted without React losing which row is which.
 *
 * `crypto.randomUUID` is unavailable outside a secure context (an app opened
 * from a phone over LAN HTTP is the case that bites here, exactly as it does
 * for `utils/clipboard.ts`), hence the fallback.
 *
 * **Not for anything a stranger could guess their way into.** The storefront
 * cart handle deliberately keeps its own generator, because there the value is
 * the only thing protecting the cart — see `services/storefront/cart-identity.ts`.
 */
export const newLocalId = (prefix = "id"): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
