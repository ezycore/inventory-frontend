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
