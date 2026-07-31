"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { VariantSelector } from "@/components/storefront/variant-selector";
import type { CardQuickBuy } from "@/components/storefront/use-card-quick-buy";

/**
 * The two rendered halves of quick buy on a product card. They are separate
 * components because they mount in different parts of the card — the flyout is
 * absolutely positioned inside the image frame, the CTA row sits in the padded
 * body — while sharing one `useCardQuickBuy` state machine.
 */

/**
 * Option chips over the bottom of the card image, for a product whose single
 * short axis fits there (`optionsFitInline`). Revealed by hover on a fine
 * pointer (CSS, `.sf-qb-card:hover`) or by the first press on touch
 * (`.sf-open`) — see storefront.css.
 *
 * Rendered only once the variants have loaded, so hovering never exposes an
 * empty bar.
 */
export function CardVariantFlyout({ qb }: { qb: CardQuickBuy }) {
  if (!qb.fitsInline || qb.soldOut) return null;
  return (
    <div className={`sf-qb-flyout${qb.flyoutOpen ? " sf-open" : ""}`}>
      <VariantSelector
        compact
        variants={qb.variants}
        selection={qb.selection}
        onSelect={qb.pick}
      />
    </div>
  );
}

/**
 * Card CTA row: Add to cart + Buy now, side by side from 680px and stacked
 * below it (two buttons do not fit across a ~150px card in the 2-column mobile
 * grid). Buy now adds the item and goes straight to checkout — the same
 * meaning it has on the product page.
 */
export function CardCtaRow({
  qb,
  bold,
}: {
  qb: CardQuickBuy;
  /** The "bold" card template — larger, uppercase, heavier CTA. */
  bold?: boolean;
}) {
  const { t } = useStorefrontUI();

  if (qb.soldOut) {
    return (
      <div style={{ marginTop: "auto" }}>
        <button type="button" disabled style={cta(false, bold, true)}>
          {t.outOfStock}
        </button>
      </div>
    );
  }

  // The labels are FIXED. An earlier cut swapped "Select options" → "Add to
  // cart" once a variant was resolvable, but that condition is really "the
  // variants finished loading" — and loading is triggered by hover, so the
  // button relabelled itself under the shopper's cursor without them clicking
  // anything. A control that rewrites itself on hover reads as a glitch.
  //
  // "Add to cart" is honest on a variant product even though the first press
  // opens the picker: the picker is a step toward the cart, not a different
  // destination, and this is what every major storefront does.
  return (
    <div
      style={{
        marginTop: "auto",
        display: "grid",
        gap: 7,
        // Deliberately not a media query: the storefront's grid columns vary by
        // breakpoint AND by card style, so the row keys off available width.
        gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
      }}
    >
      <button
        type="button"
        onClick={() => qb.press("add")}
        disabled={qb.pending}
        style={cta(false, bold, false)}
      >
        {t.addToCart}
      </button>
      <button
        type="button"
        onClick={() => qb.press("buy")}
        disabled={qb.pending}
        style={cta(true, bold, false)}
      >
        {t.buyNow}
      </button>
    </div>
  );
}

function cta(
  primary: boolean,
  bold: boolean | undefined,
  disabled: boolean,
): CSSProperties {
  return {
    background: primary ? "var(--primary)" : "transparent",
    color: primary ? "var(--on-primary)" : "var(--text)",
    border: primary ? "1px solid var(--primary)" : "1px solid var(--border-strong)",
    padding: bold ? "12px 8px" : "10px 8px",
    minHeight: 40,
    borderRadius: bold ? 9 : 7,
    fontFamily: "inherit",
    fontSize: bold ? 13 : 12.5,
    fontWeight: bold ? 700 : 600,
    textTransform: bold ? "uppercase" : "none",
    letterSpacing: bold ? "0.03em" : "normal",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    // A two-word label must not break the 40px row on a narrow card.
    lineHeight: 1.15,
  };
}
