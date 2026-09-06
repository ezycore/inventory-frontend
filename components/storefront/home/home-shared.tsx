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
  StoreTag,
  StorefrontStore,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { collectionHref, storeHref, storeLinkHref } from "@/lib/storefront-links";
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
  /** The store's tag facet — `age-chips` is the only section that reads it. */
  tags?: StoreTag[];
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
 * The `<Media>` props for the store's banner photo — its own fit and focus
 * point, set beside the banner in Customize → Hero.
 *
 * ⚠ **Deliberately NOT `useStoreImageFit()`.** These sections used to read that
 * hook, which is *Customize → Product cards → Image fit* — so changing how
 * product thumbnails crop silently re-cropped the shop's biggest picture. A grid
 * of small squares and a wide banner are different jobs. For an unset choice,
 * each section preserves the behavior it had before the control was introduced.
 *
 * Every section that displays the banner spreads this, so the merchant's answer
 * follows their photo into whichever frame is showing it. The caller supplies
 * its pre-control legacy default: framed heroes used canvas; Hero Split and
 * Full Bleed used cover. An explicit merchant choice always wins.
 */
export function bannerPhoto(
  hb?: StoreHeroBanner,
  defaultFit: "cover" | "canvas" = "canvas",
): {
  fit: "cover" | "canvas";
  focal?: string;
  mobileSrc?: string;
  mobileFocal?: string;
} {
  return {
    fit: isImageFit(hb?.imageFit) ? mediaFitFor(hb.imageFit) : defaultFit,
    focal: focalPosition(hb?.focal),
    mobileSrc: hb?.mobileImage?.mediumUrl || hb?.mobileImage?.url,
    mobileFocal: focalPosition(hb?.mobileFocal || hb?.focal),
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
  const target = storeLinkHref(base, link);
  if (/^https?:\/\//i.test(target)) {
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={target} style={style}>
      {children}
    </Link>
  );
}

/**
 * The slide's destination when it has one but no button to hang it on.
 *
 * A merchant who fills **Link** and leaves **Button label** empty used to get a
 * slide that stored a URL and did nothing: both heroes gated the link behind the
 * label, and on a picture-only slide the whole copy block — CTA included — was
 * never rendered at all. So the link falls back from the button to the slide.
 *
 * **Rendered only when there is no button label.** With one, the button is the
 * single target and the photo stays inert, which is the merchant's own rule: two
 * overlapping hit areas on the same slide is a worse answer than one.
 *
 * **`data-hero-slide-link` is load-bearing, not a hook for styling.**
 * `useHeroRotation` skips starting a swipe on interactive descendants so a press
 * on a dot or CTA is not stolen by the carousel — and this element matches that
 * selector while covering the entire slide, which would have disabled swipe
 * outright. The attribute is how the hook tells "a control the shopper aimed at"
 * from "the slide itself, wearing an anchor".
 *
 * An empty `link` must not reach `storeLinkHref`: its fallback is `/products`,
 * so a slide with no destination would quietly become a link to the catalogue.
 */
export function HeroSlideLink({
  base,
  link,
  label,
  reachable = true,
}: {
  base: string;
  link?: string;
  /** Accessible name — a picture-only slide has no text to borrow one from. */
  label: string;
  /**
   * False on a slide that is in the DOM but not showing. The carousel keeps
   * every slide mounted for the crossfade and marks the hidden ones
   * `aria-hidden`, and `pointer-events: none` does not remove a link from the
   * tab order — so without this a keyboard shopper tabs through one invisible
   * full-slide link per slide before reaching the page.
   */
  reachable?: boolean;
}) {
  if (!link?.trim()) return null;
  const target = storeLinkHref(base, link);
  const shared = {
    className: "sf-hero-slide-link",
    "data-hero-slide-link": "",
    "aria-label": label,
    tabIndex: reachable ? undefined : -1,
  };
  return /^https?:\/\//i.test(target) ? (
    <a href={target} target="_blank" rel="noopener noreferrer" {...shared} />
  ) : (
    <Link href={target} {...shared} />
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
