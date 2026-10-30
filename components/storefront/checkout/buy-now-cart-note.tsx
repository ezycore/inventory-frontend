"use client";
// coding-standard: maintained

import type { CartItem } from "@/services/stores/use-cart-store";
import type { Dict, Lang } from "@/lib/storefront-i18n";
import { formatCount } from "@/lib/storefront-social-proof";
import { useBuyNowCartMerge } from "@/services/storefront/use-buy-now";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * "You also have 2 other items in your cart" — above a Buy now checkout whose
 * cart holds lines this order leaves out.
 *
 * The cart is never pulled in silently: a shopper who pressed Buy now on one
 * product and receives a parcel of everything they once saved refuses it at the
 * door. Saying so, with a one-tap way to include them, keeps the upsell without
 * the surprise. Renders nothing when there is nothing else in the cart.
 */
export function BuyNowCartNote({
  line,
  t,
  lang,
}: {
  line: CartItem;
  t: Dict;
  lang: Lang;
}) {
  const { otherLines, merge } = useBuyNowCartMerge(line);
  if (otherLines === 0) return null;

  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 13.5,
        lineHeight: 1.45,
        padding: "10px 12px",
        marginBottom: 14,
      }}
    >
      <span style={{ display: "flex", flex: "none", color: "var(--muted)" }}>
        <Icon name="cart" size={16} />
      </span>
      <span style={{ flex: "1 1 180px" }}>
        {/* Bangla digits in Bangla: a Western digit glued to "টি" misreads. */}
        {t.buyNowCartNote.replace("{n}", formatCount(otherLines, lang))}
      </span>
      <button
        type="button"
        onClick={merge}
        style={{
          background: "none",
          border: "none",
          // ≥40px tap target without moving the label (the `tapPad` rule).
          padding: "10px 4px",
          margin: "-10px -4px",
          // The brand may be near-black; mixed with the ink it reads on both themes.
          color: "color-mix(in srgb, var(--primary) 72%, var(--text))",
          font: "inherit",
          fontWeight: 600,
          textDecoration: "underline",
          textUnderlineOffset: 3,
          cursor: "pointer",
        }}
      >
        {t.buyNowAddCart}
      </button>
    </div>
  );
}
