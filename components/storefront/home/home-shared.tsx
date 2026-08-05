"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StoreHeroBanner,
  StoreHeroSlide,
  StorePromoTile,
  StoreTrustBadge,
} from "@/lib/storefront-client";
import type { HomeVariant } from "@/lib/storefront-home-sections";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { ProductCard } from "@/components/storefront/product-card";
import { money } from "@/components/storefront/format";

export const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
};

/** Re-exported so section components have one import for their props + look. */
export type { HomeVariant };

/** What a section component receives: the page data plus its styling family. */
export interface SectionProps extends TplProps {
  variant: HomeVariant;
}

/** Page data every homepage section receives from `StoreHome`. */
export interface TplProps {
  base: string;
  currency?: string;
  featured: CatalogProduct[];
  latest: CatalogProduct[];
  categories: CatalogCategory[];
  campaigns: StoreCampaign[];
  t: Dict;
  banner?: string;
  /** Owner-managed hero slides — when non-empty, replaces the static hero. */
  heroSlides?: StoreHeroSlide[];
  /** Owner overrides for the static banner hero's copy; unset → template copy. */
  heroBanner?: StoreHeroBanner;
  /**
   * SAVED owner copy for the trust row and promo tiles. Sections resolve the
   * live draft against these themselves (same as the Rich footer does), rather
   * than having it merged upstream — the preview store is the one source for
   * "what is being edited right now".
   */
  trustBadges?: StoreTrustBadge[];
  promoTiles?: StorePromoTile[];
}

/**
 * Hero badge text from the live campaign ("test · 2% off"), so the homepage
 * never claims a sale that isn't running; null falls back to template copy.
 */
export function campaignBadge(props: TplProps): string | null {
  const c =
    props.campaigns.find((x) => x.scope === "storewide") ?? props.campaigns[0];
  if (!c) return null;
  const amount =
    c.type === "percentage" ? `${c.value}%` : money(c.value, props.currency);
  return `${c.name} · ${amount} ${props.t.campaignOff}`;
}

export function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
      {label} →
    </Link>
  );
}

export function Grid({
  products,
  currency,
  variant,
}: {
  products: CatalogProduct[];
  currency?: string;
  variant?: "full" | "compact";
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
        <ProductCard key={p._id} product={p} currency={currency} variant={variant} />
      ))}
    </div>
  );
}

/**
 * One hero CTA — an owner-entered link is either a store path (rides `base`) or
 * a full URL (opens a new tab); empty falls back to the products collection.
 * Shared by the static hero buttons and the carousel slide CTA.
 */
export function HeroCtaLink({
  base,
  link,
  style,
  children,
}: {
  base: string;
  link?: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  const target = link?.trim() || "/products";
  if (/^https?:\/\//i.test(target)) {
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={storeHref(base, target)} style={style}>
      {children}
    </Link>
  );
}

export function heroBtns(
  base: string,
  t: Dict,
  primaryLabel: string,
  hb?: StoreHeroBanner,
) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <HeroCtaLink
        base={base}
        link={hb?.primaryLink}
        style={{
          background: "var(--primary)",
          color: "var(--on-primary)",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {hb?.primaryLabel || primaryLabel}
      </HeroCtaLink>
      <HeroCtaLink
        base={base}
        link={hb?.secondaryLink}
        style={{
          color: "var(--text)",
          border: "1px solid var(--border-strong)",
          padding: "12px 22px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {hb?.secondaryLabel || t.browseCats}
      </HeroCtaLink>
    </div>
  );
}
