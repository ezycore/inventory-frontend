"use client";
// coding-standard: maintained

import type { StorefrontStore } from "@/lib/storefront-client";
import { resolveWishlistEnabled } from "@/lib/storefront-wishlist";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useHeaderVariant } from "@/components/storefront/use-utility-bar";

/**
 * Does this shop offer a wishlist? Draft-aware — the Customize switch and the
 * header layout both stream into the preview — and the one question every heart
 * asks (header, phone bar, product card, product page), so they cannot disagree.
 */
export function useWishlistEnabled(store?: StorefrontStore): boolean {
  const draft = useSfPreview((s) => s.wishlist);
  const variant = useHeaderVariant(store);
  return resolveWishlistEnabled(draft ?? store?.nav?.wishlist, variant);
}
