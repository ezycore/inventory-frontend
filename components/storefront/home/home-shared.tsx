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
  StoreSectionConfig,
  StorefrontStore,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { focalPosition } from "@/lib/storefront-focal";
import { findSectionCategory, sectionTitle } from "@/lib/storefront-sections";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { ProductCard } from "@/components/storefront/product-card";
import { money } from "@/components/storefront/format";

export const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
};

/**
 * Data every homepage SECTION receives from `StoreHome`.
 *
 * One shape for all of them on purpose: the page is a list of section ids the
 * merchant (or their theme) ordered, so `StoreHome` cannot know which props any
 * given entry needs. It hands every section everything the page fetched — which
 * costs nothing, since `shop/page.tsx` already loads the lot in one parallel
 * batch precisely so sections can be reordered without a round-trip.
 */
export interface SectionProps {
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
  /** The whole store — sections that read `trustBadges`, `social` or `name`. */
  store: StorefrontStore;
  /** This section owns the page's single visible `<h1>` when true. */
  primaryHeading?: boolean;
  /** Historical fallback until the merchant explicitly chooses grid or strip. */
  categoryRowDefault?: "strip" | "grid";
  /**
   * This INSTANCE's config, when the merchant has given it one. Absent means
   * "render your built-in source", which is what every section did before
   * `sectionConfig` existed — so an unconfigured page is unchanged.
   */
  config?: StoreSectionConfig;
  /**
   * This instance's server-fetched products. Present only alongside `config`,
   * and only for a product section: the page fetches one query per configured
   * section in parallel, so a page with two collection rows stays one round of
   * SSR rather than a waterfall.
   */
  items?: CatalogProduct[];
}

/**
 * What one product section actually renders: its products, its heading and
 * where "View all" goes.
 *
 * **Every product section resolves through here, and that is the point.** A
 * section that read `config` itself would be a section that could disagree with
 * the others about what a limit means or when a title falls back — five copies
 * of one rule, four of which drift. A section supplies only what it shows when
 * nobody has configured it.
 *
 * `items ?? []` rather than `items ?? fallback`: once a section IS configured,
 * an empty result is a real answer (a collection with nothing in stock) and the
 * section hides itself. Falling back to the catalogue-wide list there would
 * print the merchant's chosen heading over products they did not choose.
 */
export function sectionRow(
  props: SectionProps,
  fallback: { products: CatalogProduct[]; title: string },
): { products: CatalogProduct[]; title: string; href: string } {
  const { config, items, categories, base, t } = props;
  if (!config) {
    return {
      products: fallback.products,
      title: fallback.title,
      href: storeHref(base, "/products"),
    };
  }
  const found =
    config.source === "category"
      ? findSectionCategory(categories, config.categoryId)
      : null;
  return {
    products: items ?? [],
    title: sectionTitle(config, t, categories, fallback.title),
    // "View all" goes where the row's own products live — the collection page
    // for a category row, the full catalogue for the two catalogue-wide sources.
    href: found ? collectionHref(base, found.category) : storeHref(base, "/products"),
  };
}

/**
 * The `<Media>` props for the store's banner photo — its own fit and focus
 * point, set beside the banner in Customize → Hero.
 *
 * ⚠ **Deliberately NOT `useStoreImageFit()`.** These sections used to read that
 * hook, which is *Customize → Product cards → Image fit* — so changing how
 * product thumbnails crop silently re-cropped the shop's biggest picture. A grid
 * of small squares and a wide banner are different jobs. Unset means "fit": show
 * the whole photo, the one answer that can never cut a face or a word in half.
 *
 * Every section that CROPS the banner spreads this (`HeroCard`, `HeroOpen`,
 * `EditorialSplit`), so the merchant's answer follows their photo into whichever
 * frame is showing it. `HeroSplit` is the exception and needs nothing: it runs
 * `ratio="auto"`, so there is no frame to miss and nothing to trim.
 */
export function bannerPhoto(hb?: StoreHeroBanner): {
  fit: "cover" | "canvas";
  focal?: string;
} {
  return {
    fit: isImageFit(hb?.imageFit) ? mediaFitFor(hb.imageFit) : "canvas",
    focal: focalPosition(hb?.focal),
  };
}

/**
 * Hero badge text from the live campaign ("test · 2% off"), so the homepage
 * never claims a sale that isn't running; null falls back to template copy.
 */
export function campaignBadge(props: SectionProps): string | null {
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
          borderRadius: "var(--radius-sm)",
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
          borderRadius: "var(--radius-sm)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {hb?.secondaryLabel || t.browseCats}
      </HeroCtaLink>
    </div>
  );
}
