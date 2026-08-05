"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import {
  HeroCtaLink,
  ViewAll,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * Blocks for the **Grocery** template — everyday essentials, bought again and
 * again by the same people.
 *
 * These shoppers are not browsing and not comparing; they are refilling a list.
 * So the page opens with departments rather than a picture, the promo is a
 * single slim bar instead of a banner that pushes product below the fold, and
 * everything is compact — the fastest route from landing to a full cart wins
 * over anything decorative.
 *
 * It deliberately reuses Superstore's deals rail and trust strip: a grocery
 * shop's savings row and its delivery promises are the same thing as a general
 * retailer's, and a second implementation would be two things to keep in step
 * for no visible difference.
 */

/**
 * One slim promotional line. It yields to a merchant's carousel — someone who
 * built slides gets them — but the default is a bar, not a banner, because on
 * a grocery home page a 400px hero is 400px of not-shopping.
 */
export function PromoBar({ base, t, heroBanner: hb }: SectionProps) {
  const headline = hb?.title?.trim() || t.heroAt;
  return (
    <div style={{ ...wrap, padding: "var(--pad) var(--pad) 0" }}>
      <HeroCtaLink
        base={base}
        link={hb?.primaryLink}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          background: "var(--primary)",
          color: "var(--on-primary)",
          borderRadius: "var(--r-md)",
          padding: "12px 16px",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "rgba(255,255,255,0.22)",
            borderRadius: 999,
            padding: "3px 9px",
          }}
        >
          {hb?.badge || t.eidBadge}
        </span>
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.25,
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          {headline}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          {hb?.primaryLabel || t.shopNow} →
        </span>
      </HeroCtaLink>
    </div>
  );
}

/**
 * Departments first, and compact. A grocery shopper knows whether they want
 * rice or soap before the page loads, so this is navigation rather than
 * merchandising — small tiles, many visible at once, no scrolling required.
 */
export function DepartmentShelf({ base, categories, t }: SectionProps) {
  if (categories.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "14px var(--pad) 4px" }}>
      <SectionTitle
        action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}
      >
        {t.browseCats}
      </SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
          gap: "var(--gap)",
        }}
      >
        {categories.map((c) => {
          const img = thumbImageUrl(c.image);
          return (
            <Link
              key={c._id}
              href={storeHref(base, `/products?categoryId=${c._id}`)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                padding: "12px 8px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--r-pill)",
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  fontWeight: 700,
                  overflow: "hidden",
                }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  c.name.trim().charAt(0).toUpperCase()
                )}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.2 }}>
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Compact product shelf — the same card everywhere, at grocery density. */
function Shelf({
  base,
  currency,
  products,
  heading,
  t,
}: Pick<SectionProps, "base" | "currency" | "t"> & {
  products: SectionProps["featured"];
  heading: string;
}) {
  if (products.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "12px var(--pad)" }}>
      <SectionTitle
        action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}
      >
        {heading}
      </SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(var(--cols), minmax(0,1fr))",
          gap: "var(--gap)",
        }}
      >
        {products.map((p) => (
          <ProductCard key={p._id} product={p} currency={currency} variant="compact" />
        ))}
      </div>
    </div>
  );
}

export function GroceryFeatured(props: SectionProps) {
  return <Shelf {...props} products={props.featured} heading={props.t.featured} />;
}

export function GroceryLatest(props: SectionProps) {
  return <Shelf {...props} products={props.latest} heading={props.t.newArrivals} />;
}
