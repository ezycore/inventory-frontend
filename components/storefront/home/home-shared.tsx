"use client";
// coding-standard: maintained

/**
 * The product grid the builder's product sections draw, and the whole-row trim
 * they apply to it.
 *
 * This file held every classic home section's shared props and helpers until
 * that home was deleted (2026-09-29); these two are what the builder still uses.
 */
import type { CatalogProduct } from "@/lib/storefront-client";
import { ProductCard } from "@/components/storefront/product-card";

/**
 * The narrowest column count `<Grid>`'s `--cols` ever resolves to (see
 * `storefront.css`) — 2 on a phone, up to 7 on a dense wide desktop. There is
 * no single number that rounds a product count to a whole row at every one of
 * those; a JS-side trim can only target the layout the merchant is actually
 * looking at when they picked a count, which for a "how many products" call
 * is desktop. 4 is that floor: every desktop breakpoint runs `--cols >= 4`.
 */
const ROW_COLS = 4;

/**
 * Drop the trailing orphans a product count leaves under a fixed-column grid
 * (QA-124) — a catalogue with 6 featured products in a 4-wide grid used to
 * render one full row plus two products alone in a second, which reads as
 * broken rather than as "there are only six". A count of `ROW_COLS` or fewer
 * is left alone: a single short row is an ordinary small catalogue, not the
 * ragged-second-row shape this exists to fix. Still imperfect at any other
 * breakpoint (3, 5, 6 and 7-column layouts have no shared multiple with 4
 * short of 420 products) — the trade a merchant already makes on `<MinimalPicks>`'s
 * fixed cap of 6, applied here instead of hand-tuned per section.
 */
export function trimToWholeRows<T>(items: readonly T[]): T[] {
  if (items.length <= ROW_COLS) return [...items];
  const whole = Math.floor(items.length / ROW_COLS) * ROW_COLS;
  return items.slice(0, whole || ROW_COLS);
}

/**
 * The product grid every product row renders through.
 *
 * **No density prop.** It took a `variant` until the three grid sections became
 * one, and that flag was only ever consulted for `productCard: "standard"` —
 * `compact`, `bold` and `editorial` each override it outright. So it was a
 * second, hidden answer to a question the merchant already answers in Customize
 * → Product cards, and the only way to reach it was to pick a different section
 * type. Density is one decision for the whole shop now, in the panel named
 * after it.
 */
export function Grid({
  products,
  currency,
  imageFit,
  imageRatio,
}: {
  products: CatalogProduct[];
  currency?: string;
  /** A builder section's own card photo fit and frame; unset follows Customize. */
  imageFit?: "cover" | "canvas";
  imageRatio?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(var(--cols), minmax(0,1fr))",
        gap: "var(--gap)",
      }}
    >
      {products.map((p) => (
        <ProductCard
          key={p._id}
          product={p}
          currency={currency}
          imageFit={imageFit}
          imageRatio={imageRatio}
        />
      ))}
    </div>
  );
}
