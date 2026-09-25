// coding-standard: maintained
import Link from "next/link";
import type { CatalogProduct } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { Media } from "@/components/storefront/sf-bits";
import { money } from "@/components/storefront/format";

/**
 * Bare picks — image, name, price, nothing else. Drawn by the home page's
 * `MinimalPicks` and the Storefront Builder's selected-products section.
 *
 * Deliberately NOT `ProductCard`: no border, no background, no buttons, wider
 * gutters. A boutique grid sells by photograph, and card chrome is what stops it
 * looking like one. Pure markup, so a server component can render it — the
 * builder section ships no card code at all.
 */
export function PickGrid({
  products,
  base,
  currency,
  imageFit,
  imageRatio,
  loading,
}: {
  products: readonly CatalogProduct[];
  base: string;
  currency?: string;
  imageFit: "cover" | "canvas";
  /** A CSS `aspect-ratio`, e.g. `"3 / 4"`. */
  imageRatio: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--mincols), minmax(0,1fr))", gap: "clamp(20px,3vw,40px)" }}>
      {products.map((p) => (
        <Link key={p._id} href={storeHref(base, `/products/${p.slug}`)} style={{ display: "flex", flexDirection: "column" }}>
          <Media
            src={cardImageUrl(p.images?.[0])}
            alt={p.name}
            label="product"
            radius={12}
            fit={imageFit}
            ratio={imageRatio}
            loading={loading}
            style={{ marginBottom: 14 }}
          />
          {/* INHERIT: a bare pick has no card of its own, so the name and the
              price are drawn straight on the section's band and must take its
              Text colour (`.sfb-sec[data-tone]`). Outside a builder section the
              inherited colour is `--text`, which is what they said before. */}
          <span style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: 1.35, marginBottom: 4 }}>{p.name}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "inherit" }}>{money(p.price, currency)}</span>
        </Link>
      ))}
    </div>
  );
}
