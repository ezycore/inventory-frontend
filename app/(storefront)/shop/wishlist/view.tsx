"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { WishlistSection } from "@/components/storefront/account/wishlist-section";

/** The wishlist page's frame: the section Account → Wishlist draws, at full shop width. */
export default function View() {
  const { t } = useStorefrontUI();
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "28px var(--pad) 56px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>{t.tabWishlist}</h1>
      <WishlistSection />
    </div>
  );
}
