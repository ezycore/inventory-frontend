"use client";

import { useCartStore } from "@/services/stores/use-cart-store";
import { useCartUI } from "@/services/stores/use-cart-ui-store";

/**
 * Shared cart navigation for storefront chrome. Both the header and the mobile
 * bottom nav need the live cart count plus "go to cart", so it lives here as
 * one source instead of being re-derived per surface. The cart icon always
 * opens the drawer for a quick review — the full /cart page is reachable from
 * the drawer's "View cart" link. The PDP's "Buy now" opens the same drawer.
 * (Search now has its own in-header typeahead — `components/storefront/
 * header-search.tsx` — so this no longer routes to a /search page.)
 */
export function useCartNav(slug: string) {
  const cartCount = useCartStore((s) =>
    s.storeSlug === slug ? s.items.reduce((n, i) => n + i.quantity, 0) : 0,
  );
  const openCart = useCartUI((s) => s.openCart);

  const goCart = () => openCart();

  return { cartCount, goCart };
}
