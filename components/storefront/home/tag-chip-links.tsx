// coding-standard: maintained
import Link from "next/link";
import type { StoreTag } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";

/**
 * One chip per tag, each a link to the catalogue filtered by it
 * (`/products?tags=<slug>` — OR-combined, supported end to end). Drawn by the
 * home page's `TagChips` and the Storefront Builder's shop-by-tag section.
 *
 * Scrolls on a phone rather than wrapping to three ragged rows — eight chips is
 * one comfortable swipe and the order carries the meaning. Pure markup, so a
 * server component can render it.
 */
export function TagChipLinks({
  base,
  tags,
}: {
  base: string;
  tags: readonly Pick<StoreTag, "_id" | "name" | "slug">[];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 4,
        scrollbarWidth: "none",
      }}
    >
      {tags.map((tag) => (
        <Link
          key={tag._id}
          href={storeHref(base, `/products?tags=${encodeURIComponent(tag.slug)}`)}
          style={{
            flex: "0 0 auto",
            border: "1px solid var(--border)",
            /* The chip paints its OWN ground, so it keeps the theme's ink
               rather than inheriting the section's Text colour — a white chip
               on a dark band would otherwise take that band's white words and
               vanish. Same rule as `--sfb-muted` in `storefront-builder.css`:
               only text drawn directly on the band follows the tone. */
            background: "var(--card)",
            color: "var(--text)",
            borderRadius: 999,
            padding: "11px 20px",
            fontSize: 13.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
