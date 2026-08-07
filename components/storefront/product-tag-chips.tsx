"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type { ProductTag } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { readableTextOn } from "@/lib/color-contrast";

/**
 * The merchant's product labels, rendered as chips. One component, three homes —
 * the product page (linked into the `?tags=` facet), the product card's image,
 * and the search page's list rows.
 *
 * **Two independent axes**, because the surfaces need every combination:
 *
 * - `tone` — `soft` (tinted chip on a card/page background) or `solid` (the tag
 *   colour at full strength, for laying over a product photo). This is not
 *   decoration: a soft tint is legible on a page background and invisible over
 *   an arbitrary photo.
 * - **`base` decides link vs span.** Pass it and each chip becomes a `<Link>` to
 *   the facet; omit it and they are inert `<span>`s. Omit it whenever the chips
 *   sit *inside* another link — the card's image and the search row's text block
 *   are both wrapped in one, and an `<a>` inside an `<a>` is invalid markup that
 *   browsers reparent (same reason `CardVariantFlyout` is a sibling of the card
 *   link, not a child).
 *   ⚠ **Test it with `!= null`, never for truthiness.** A store on a custom
 *   domain has `base === ""` — the shop is at the root there — so a falsy check
 *   would silently strip the links from every custom-domain store, which is the
 *   half of the estate least likely to be the one you're looking at in dev.
 *
 * Colour handling follows `StatusPill` (`sf-bits.tsx`): the hue is mixed toward
 * `--text` rather than used raw, so a merchant's chip darkens on the light theme
 * and lightens on the dark one instead of vanishing into one of them. A tag with
 * no colour falls back to the neutral tokens.
 */
export function ProductTagChips({
  tags,
  base,
  tone = "soft",
  max,
  style,
}: {
  tags?: ProductTag[];
  /** Store link base. Present ⇒ chips link to the facet. See the note above. */
  base?: string;
  tone?: "soft" | "solid";
  /** Cap the number shown; the rest are dropped (no "+N" — a card has no room). */
  max?: number;
  style?: CSSProperties;
}) {
  // A tag with no slug cannot address the facet, so it would render a chip that
  // filters nothing. Dropped rather than shown inert.
  const shown = (tags ?? []).filter((tag) => !!tag.slug).slice(0, max);
  if (shown.length === 0) return null;

  return (
    <span
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        minWidth: 0,
        ...style,
      }}
    >
      {shown.map((tag) =>
        base == null ? (
          <span key={tag._id} style={chipStyle(tag, tone)}>
            {tag.name}
          </span>
        ) : (
          <Link
            key={tag._id}
            href={storeHref(base, `/products?tags=${encodeURIComponent(tag.slug!)}`)}
            style={chipStyle(tag, tone)}
          >
            {tag.name}
          </Link>
        ),
      )}
    </span>
  );
}

function chipStyle(tag: ProductTag, tone: "soft" | "solid"): CSSProperties {
  const color = tag.color?.trim();
  const base: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    padding: tone === "solid" ? "3px 8px" : "4px 10px",
    borderRadius: 999,
    lineHeight: 1.35,
    // Cards are ~130px wide in the 2-column mobile grid and clip their overflow,
    // so a long label truncates instead of pushing the chip off the image.
    maxWidth: tone === "solid" ? 104 : undefined,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  if (tone === "solid") {
    return {
      ...base,
      background: color || "var(--text)",
      color: color ? readableTextOn(color) : "var(--card)",
      // The photo behind it is unknown; a hairline keeps the pill's edge visible
      // against a same-coloured product.
      boxShadow: "0 1px 3px rgba(0,0,0,0.22)",
    };
  }
  return {
    ...base,
    color: color ? `color-mix(in srgb, ${color} 72%, var(--text))` : "var(--muted)",
    background: color
      ? `color-mix(in srgb, ${color} 12%, transparent)`
      : "var(--surface-2)",
    border: `1px solid ${
      color ? `color-mix(in srgb, ${color} 32%, transparent)` : "var(--border)"
    }`,
  };
}
