// coding-standard: maintained

/**
 * Whether the shop offers a wishlist (`nav.wishlist`) — Customize → Header.
 *
 * One switch for every heart: the header's, the product card's and the product
 * page's. A heart a shopper can tap with no list to open, or a list nobody can
 * add to, is the bug this setting replaced — the product page drew its heart on
 * every shop, including ones with no screen that showed the list.
 *
 * Absent follows the header: Showroom drew a heart before this setting existed,
 * every other header did not, so a shop that never opens the switch keeps the
 * header it had. Only a merchant's explicit choice is stored, which is also what
 * lets an untouched shop pick the heart up by switching to Showroom.
 *
 * Plan: docs/plan/wishlist.md (inventory-backend), decisions D1–D3.
 */

/** As stored: loose, because it arrives from a database document. */
export interface WishlistConfig {
  enabled?: boolean;
}

export const resolveWishlistEnabled = (
  config: WishlistConfig | undefined,
  headerVariant: string | undefined,
): boolean =>
  typeof config?.enabled === "boolean" ? config.enabled : headerVariant === "showroom";
