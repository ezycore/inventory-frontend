"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { money } from "@/components/storefront/format";
import {
  Grid,
  ViewAll,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The featured-products block. The three looks differ by more than density:
 * each carries its own heading copy ("Featured" / "Weekly picks" / "Selected"),
 * and minimal renders its own card markup rather than `ProductCard` — a quieter
 * card with no badges or cart button, capped at six.
 */
export function FeaturedSection({
  base,
  currency,
  featured,
  t,
  variant,
}: SectionProps) {
  if (featured.length === 0) return null;
  if (variant === "minimal") {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(48px,7vw,80px)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{t.selected}</h2>
          <ViewAll href={storeHref(base, "/products")} label={t.viewAll} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--mincols), minmax(0,1fr))", gap: "clamp(20px,3vw,40px)" }}>
          {featured.slice(0, 6).map((p) => (
            <Link key={p._id} href={storeHref(base, `/products/${p.slug}`)} style={{ display: "flex", flexDirection: "column" }}>
              <Media src={cardImageUrl(p.images?.[0])} alt={p.name} label="product" radius={12} style={{ marginBottom: 14 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.35, marginBottom: 4 }}>{p.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{money(p.price, currency)}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  const split = variant === "hero-split";
  return (
    <div style={{ ...wrap, padding: "22px var(--pad)" }}>
      <SectionTitle action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}>
        {split ? t.weeklyPicks : t.featured}
      </SectionTitle>
      <Grid products={featured} currency={currency} variant={split ? "compact" : "full"} />
    </div>
  );
}
