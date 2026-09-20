"use client";
// coding-standard: maintained

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
import { findSectionCategory, orderByIds, sectionTitle } from "@/lib/storefront-sections";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { ProductCard } from "@/components/storefront/product-card";
import { money } from "@/components/storefront/format";
import { HeroCtaLink } from "@/components/storefront/home/hero-links";
import {
  HeroActions,
  heroPrimaryButton,
  heroSecondaryButton,
} from "@/components/storefront/home/hero-static";

// Moved out so server components can use them without this module's product
// card; re-exported so every home section keeps its import.
export { wrap } from "@/components/storefront/home/wrap";
export { HeroCtaLink, HeroSlideLink } from "@/components/storefront/home/hero-links";

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
  /** The store's tag facet — `tag-chips` is the only section that reads it. */
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
   * Where the open hero's copy sits (Customize → Hero). Resolved once in
   * `StoreHome` so the section never reads a raw stored id, and so the draft
   * value reaches the Customize preview the same way every other look does.
   *
   * Read only by `hero-open`. `hero-card` sets its copy beside a photo and
   * `hero-fullbleed` lays type over one, so neither has an alignment worth
   * asking about.
   */
  heroAlign?: "left" | "center";
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
): {
  products: CatalogProduct[];
  title: string;
  href: string;
  /** Button wording; blank-safe, already localized. */
  ctaLabel: string;
  /** False when the merchant switched the row's button off. */
  showCta: boolean;
  /**
   * The merchant hand-picked this row's products. Grids read it to skip the
   * whole-row trim — see `gridProducts`.
   */
  isManual: boolean;
} {
  const { config, items, categories, base, t } = props;
  if (!config) {
    return {
      products: fallback.products,
      title: fallback.title,
      href: storeHref(base, "/products"),
      ctaLabel: t.viewAll,
      showCta: true,
      isManual: false,
    };
  }
  const found =
    config.source === "category"
      ? findSectionCategory(categories, config.categoryId)
      : null;
  // "View all" goes where the row's own products live — the collection page for
  // a category row, the full catalogue for the catalogue-wide sources. A
  // hand-picked row has no such destination, which is why `ctaHref` exists; an
  // explicit one wins for every source.
  const derived = found
    ? collectionHref(base, found.category)
    : storeHref(base, "/products");
  const ownHref = config.ctaHref?.trim();
  /* A config with NO source is the editor's own "Default for this section", and
     it is reachable rather than theoretical: emptying a hand-picked row that
     also carries a heading or a button keeps those and drops `source` plus
     `productIds` (see `ProductRowConfig.set`). Such a row must draw the
     section's OWN products.

     Without this it drew nothing at all, and silently: `sectionQuery` returns
     `null` for a sourceless config, so `configuredSections` never fetched for
     that key, `items` arrived undefined, and `items ?? []` — correct for a row
     that asked a real question and got an empty answer — became an empty grid
     that every section hides itself for. Writing a heading on a row and then
     clearing its picks made the whole section disappear from the homepage. */
  const sourced = !!config.source;
  return {
    /* Re-sorted into the merchant's pick order: the query sends ids to `$in`,
       which returns no order at all.

       ⚠ Gated on the source, not just on `productIds` being present. The editor
       MERGES config patches, so switching a row from "Products I pick" back to
       Featured leaves the old `productIds` on the document — nothing clears it
       and the validator only requires the list for `manual`, never rejects it
       elsewhere. Ungated, those stale ids silently hoisted their products to
       the front of an unrelated row for as long as they stayed in it. The
       editor now clears them on the way out too; this half also fixes the
       documents that were already saved. */
    products: sourced
      ? orderByIds(
          items ?? [],
          config.source === "manual" ? config.productIds : undefined,
        )
      : fallback.products,
    title: sectionTitle(config, t, categories, fallback.title),
    href: ownHref ? storeLinkHref(base, ownHref) : derived,
    ctaLabel: config.ctaLabel?.trim() || t.viewAll,
    showCta: config.showCta ?? true,
    isManual: config.source === "manual",
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
 * What a product GRID actually renders — the trim applied only where it means
 * something.
 *
 * ⚠ **A hand-picked row is never trimmed.** `trimToWholeRows` exists to hide the
 * orphans an arbitrary catalogue count leaves in a fixed-column grid; on a
 * curated list there are no orphans, only products the merchant chose. Trimming
 * one is a silent edit of their decision, and a bad one: five picks rendered
 * four, six rendered four, seven rendered four, nine rendered eight. It also
 * contradicted every other half of this feature — `sectionQuery` sets
 * `limit: ids.length` rather than clamping precisely so nobody gains a product
 * they did not pick, and the editor hides the "Show N" input for these rows
 * because the list IS the length.
 *
 * It bit hardest in combination with `inStock`: pick eight, two sell out, six
 * come back, and the trim took it to four.
 *
 * The three grids share this rather than each deciding, for the same reason
 * they share `sectionRow` — three copies of one rule is two chances to drift.
 * `ProductRail` (a scroller, no rows to leave ragged) and `MinimalPicks` (its
 * own fixed cap of six) deliberately call neither.
 */
export function gridProducts(row: {
  products: CatalogProduct[];
  isManual: boolean;
}): CatalogProduct[] {
  return row.isManual ? [...row.products] : trimToWholeRows(row.products);
}

/**
 * The `<Media>` props for the store's banner photo — its own fit and focus
 * point, set beside the banner in Customize → Look.
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

/** The static heroes' button pair: the banner's own wording, else the store's defaults. */
export function heroBtns(
  base: string,
  t: Dict,
  primaryLabel: string,
  hb?: StoreHeroBanner,
  /** Follows the hero's own alignment — see `align` on `SectionProps`. */
  align: "left" | "center" = "left",
) {
  return (
    <HeroActions align={align}>
      <HeroCtaLink base={base} link={hb?.primaryLink} style={heroPrimaryButton}>
        {hb?.primaryLabel || primaryLabel}
      </HeroCtaLink>
      <HeroCtaLink base={base} link={hb?.secondaryLink} style={heroSecondaryButton}>
        {hb?.secondaryLabel || t.browseCats}
      </HeroCtaLink>
    </HeroActions>
  );
}
