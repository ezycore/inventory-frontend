"use client";

import { useRouter } from "next/navigation";
import { storeHref } from "@/lib/storefront-links";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useCartUI } from "@/services/stores/use-cart-ui-store";

/**
 * Shared cart/search navigation for storefront chrome. Both the header and the
 * mobile bottom nav need the live cart count plus "go to cart" and "go to
 * search", so it lives here as one source instead of being re-derived per
 * surface. The cart icon always opens the drawer for a quick review — the full
 * /cart page is reachable from the drawer's "View cart" link. `templates.cart`
 * still decides where "Buy now" lands (drawer vs page).
 */
export function useCartNav(slug: string, base: string) {
  const router = useRouter();
  const cartCount = useCartStore((s) =>
    s.storeSlug === slug ? s.items.reduce((n, i) => n + i.quantity, 0) : 0,
  );
  const openCart = useCartUI((s) => s.openCart);

  const goCart = () => openCart();
  const goSearch = () => router.push(storeHref(base, "/search"));

  return { cartCount, goCart, goSearch };
}
