"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { money } from "@/components/storefront/format";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import { useStoreImageRatio } from "@/services/storefront/use-image-ratio";
import {
  Grid,
  ViewAll,
  gridProducts,
  sectionRow,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The product-row family: a grid, a rail and a bare boutique edit. The choice
 * says more about a shop than its colour does — a grid reads as the catalogue,
 * a horizontal rail as a convenience app, a bare grid as a boutique.
 *
 * **Three grids became one on 2026-09-06.** `featured-grid`, `latest-grid` and
 * `picks-grid` all called this same `Grid` through this same `sectionRow`; what
 * separated them was which fallback list they drew from — and `sectionConfig`
 * answered that for every row the moment it shipped. What was left was a
 * density flag `templates.productCard` overrides for three of its four values.
 * So the section type was carrying a decision the merchant makes elsewhere, and
 * the picker asked them to choose a component when they meant to choose
 * products. One grid, pointed by its source.
 *
 * Every one renders nothing when its list is empty — a reordered page must not
 * grow holes.
 */

/**
 * A grid of products under a heading — the one product row a merchant points
 * wherever they want it.
 *
 * Unconfigured it shows the store's featured products, which is what
 * `featured-grid` has always done, so a page that has never been configured is
 * unchanged. A row sourced `newest` says "New arrivals" in the shopper's
 * language (`sectionTitle`), which is the whole of what the retired
 * `latest-grid` contributed beyond its density.
 */
export function ProductGrid(props: SectionProps) {
  const { currency, featured, t } = props;
  const row = sectionRow(props, { products: featured, title: t.featured });
  if (!row.products.length) return null;
  return (
    <div style={{ ...wrap, padding: "22px var(--pad)" }}>
      <SectionTitle
        action={row.showCta ? <ViewAll href={row.href} label={row.ctaLabel} /> : null}
      >
        {row.title}
      </SectionTitle>
      <Grid products={gridProducts(row)} currency={currency} />
    </div>
  );
}

/**
 * Horizontal scroll rail.
 *
 * A rail says "there is more where this came from" without spending a screen on
 * it, which is why every quick-commerce app is built from them and why a grocery
 * homepage can carry six rows without feeling endless. Snap points keep a swipe
 * landing on a card rather than between two.
 *
 * **It sits on a full-width BAND**, and that is load-bearing rather than
 * decoration. A rail is the one product section a shopper is meant to read as a
 * single object — "here is a set" — where a grid reads as "here is the
 * catalogue"; the band is what says so, and it also stops a scrollable row from
 * looking like a grid that failed to wrap. Measuring a designed page against a
 * rendered one is what surfaced this: the design spent 22% of its area on tinted
 * bands and the shop spent 0.5%, which is most of why the same palette read as a
 * flat sheet on one and a layered page on the other.
 */
export function ProductRail(props: SectionProps) {
  const { currency, latest, t } = props;
  const row = sectionRow(props, { products: latest, title: t.newArrivals });
  if (!row.products.length) return null;
  return (
    <section style={{ background: "var(--surface)" }}>
    <div style={{ ...wrap, padding: "clamp(20px,3vw,32px) var(--pad)" }}>
      <SectionTitle
        action={row.showCta ? <ViewAll href={row.href} label={row.ctaLabel} /> : null}
      >
        {row.title}
      </SectionTitle>
      {/* `grid-auto-flow: column` + an explicit track width, because a flex row
          of `flex: 1` cards would divide the viewport instead of overflowing. */}
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(150px, calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols)))",
          gap: "var(--gap)",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          // Room for the cards' shadow and the scrollbar, so neither is clipped.
          padding: "2px 0 10px",
          scrollbarWidth: "thin",
        }}
      >
        {row.products.map((p) => (
          <div key={p._id} style={{ scrollSnapAlign: "start" }}>
            <ProductCard product={p} currency={currency} variant="compact" />
          </div>
        ))}
      </div>
    </div>
    </section>
  );
}

/**
 * Bare picks — image, name, price, nothing else.
 *
 * Deliberately NOT `ProductCard`: no border, no background, no buttons, wider
 * gutters. A boutique grid sells by photograph, and card chrome is what stops it
 * looking like one. Capped at six because the point is an edit, not a catalogue.
 */
export function MinimalPicks(props: SectionProps) {
  const { base, currency, featured, t } = props;
  const row = sectionRow(props, { products: featured, title: t.selected });
  // Still capped at six even when configured: the point of this section is an
  // edit, and a merchant who asks for twelve here has picked the wrong section
  // rather than expressed an intent this one should honour.
  const picks = row.products.slice(0, 6);
  const imageFit = useStoreImageFit();
  const imageRatio = useStoreImageRatio();
  if (!picks.length) return null;
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(48px,7vw,80px)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{row.title}</h2>
        {row.showCta ? <ViewAll href={row.href} label={row.ctaLabel} /> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--mincols), minmax(0,1fr))", gap: "clamp(20px,3vw,40px)" }}>
        {picks.map((p) => (
          <Link key={p._id} href={storeHref(base, `/products/${p.slug}`)} style={{ display: "flex", flexDirection: "column" }}>
            <Media
              src={cardImageUrl(p.images?.[0])}
              alt={p.name}
              label="product"
              radius={12}
              fit={imageFit}
              ratio={imageRatio}
              style={{ marginBottom: 14 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.35, marginBottom: 4 }}>{p.name}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{money(p.price, currency)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
