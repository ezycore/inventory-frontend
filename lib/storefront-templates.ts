// coding-standard: maintained
import type {
  HeaderMenuSource,
  StoreLogoStyle,
  StoreTemplates,
  StoreTemplatesRaw,
  StorefrontStore,
} from "@/lib/storefront-client";
import { DEFAULT_MOBILE_TEMPLATE, mobileTemplate } from "@/lib/storefront-mobile";

/** Default page variants when the store hasn't selected one (or backend omits it). */
export const DEFAULT_TEMPLATES: StoreTemplates = {
  collection: "grid4",
  product: "left",
  checkout: "single",
  footer: "columns",
  header: "classic",
  productCard: "standard",
  cardActions: "addBuy",
  // Both are what every card rendered before the settings existed.
  cardTagBadges: "2",
  discountBadge: "percent",
  pagination: "pages",
  imageFit: "fit",
  imageRatio: "square",
  accountLayout: "sidebar",
  contentLayout: "centered",
  cartLayout: "panel",
  shell: "stacked",
  mobile: DEFAULT_MOBILE_TEMPLATE,
};

const COLLECTION = { "grid-3": "grid3", "grid-4": "grid4", sidebar: "sidebar" } as const;
const PRODUCT = { "gallery-left": "left", "gallery-top": "top", "sticky-bar": "sticky" } as const;
// Whole checkout layouts. The first two ids predate the layout registry and are
// unchanged, so every store that already picked one keeps its checkout exactly.
const CHECKOUT = {
  "single-page": "single",
  "multi-step": "multi",
  guided: "guided",
  editorial: "editorial",
} as const;
// `columns` / `simple` / `rich` are the three that have always existed; their
// LAYOUTS were rebuilt on 2026-08-11 but the ids are unchanged on purpose, so
// every existing store picks up the repair without its owner choosing again.
const FOOTER = {
  columns: "columns",
  simple: "simple",
  rich: "rich",
  contact: "contact",
  newsletter: "newsletter",
} as const;
const HEADER = {
  classic: "classic",
  minimal: "minimal",
  centered: "centered",
  "search-first": "search-first",
  clinical: "clinical",
  boutique: "boutique",
} as const;
// `editorial` is the chrome-less card — no border, no background, no buttons.
const PRODUCTCARD = {
  standard: "standard",
  compact: "compact",
  bold: "bold",
  editorial: "editorial",
} as const;
// Card CTA layout. Separate from PRODUCTCARD on purpose: density and actions are
// orthogonal, and folding them together would need one id per combination.
const CARDACTIONS = {
  add: "add",
  "add-buy": "addBuy",
  icons: "icons",
  "buy-first": "buyFirst",
  reveal: "reveal",
  "icon-only": "iconOnly",
} as const;
const HEADER_MENU = { collections: "collections", custom: "custom" } as const;
// How product listings advance past page 1. `pages` stays the default: it is what
// every existing store already renders, and it is the only mode that puts a real
// paginated crawl path in the HTML without help.
const PAGINATION = { pages: "pages", infinite: "infinite", "load-more": "loadMore" } as const;
const IMAGEFIT = { fit: "fit", crop: "crop" } as const;
// Card badges — the stored ids ARE the variant names, so these maps only narrow.
const CARDTAGBADGES = { "0": "0", "1": "1", "2": "2" } as const;
const DISCOUNTBADGE = { percent: "percent", amount: "amount", off: "off" } as const;
// The FRAME a product photo sits in, orthogonal to IMAGEFIT (which decides what
// happens to a photo that doesn't match the frame). `square` stays the default:
// it is what every store rendered before this existed.
const IMAGERATIO = {
  square: "square",
  portrait: "portrait",
  landscape: "landscape",
  tall: "tall",
} as const;
// Whole account-area layouts. `sidebar` is the default because it is what the
// account area has always been; the other three are separate page components,
// not restyles of it.
const ACCOUNTLAYOUT = {
  sidebar: "sidebar",
  tabs: "tabs",
  panel: "panel",
  editorial: "editorial",
} as const;
// Whole cart pages. `panel` is the default — lines on a card beside a summary,
// which is the cart the storefront has always had.
const CARTLAYOUT = {
  panel: "panel",
  compact: "compact",
  cards: "cards",
  editorial: "editorial",
} as const;
// The page skeleton. `stacked` is the default because it is the only shape the
// storefront had; `rail` puts a department column on every page.
const SHELL = { stacked: "stacked", rail: "rail" } as const;
// Whole frames for the CMS pages + order tracking. `centered` is the default —
// it is the prose column those pages have always been.
const CONTENTLAYOUT = {
  centered: "centered",
  banner: "banner",
  panel: "panel",
  editorial: "editorial",
} as const;

/**
 * `Object.hasOwn`, not `map[raw]` — these maps are plain objects, so a stored id
 * of `"constructor"` or `"toString"` hits `Object.prototype`, reads as truthy,
 * and returns a **function** where every caller expects a variant name. The
 * values are merchant-controlled strings the backend only length-checks, so this
 * is reachable from stored data rather than theoretical.
 */
function pick<M extends Record<string, string>>(
  map: M,
  raw: string | undefined,
  fallback: M[keyof M],
): M[keyof M] {
  return raw && Object.hasOwn(map, raw) ? (map[raw] as M[keyof M]) : fallback;
}

/** Resolve a store's raw template ids into the storefront's variant names. */
export function resolveTemplates(
  store: Pick<StorefrontStore, "templates"> | null | undefined,
): StoreTemplates {
  const t = store?.templates ?? {};
  const productCard = pick(
    PRODUCTCARD,
    t.productCard,
    DEFAULT_TEMPLATES.productCard,
  );
  return {
    collection: pick(COLLECTION, t.collection, DEFAULT_TEMPLATES.collection),
    product: pick(PRODUCT, t.product, DEFAULT_TEMPLATES.product),
    checkout: pick(CHECKOUT, t.checkout, DEFAULT_TEMPLATES.checkout),
    footer: pick(FOOTER, t.footer, DEFAULT_TEMPLATES.footer),
    header: pick(HEADER, t.header, DEFAULT_TEMPLATES.header),
    productCard,
    cardActions: resolveCardActions(t.cardActions, productCard),
    cardTagBadges: pick(CARDTAGBADGES, t.cardTagBadges, DEFAULT_TEMPLATES.cardTagBadges),
    discountBadge: pick(DISCOUNTBADGE, t.discountBadge, DEFAULT_TEMPLATES.discountBadge),
    pagination: pick(PAGINATION, t.pagination, DEFAULT_TEMPLATES.pagination),
    imageFit: pick(IMAGEFIT, t.imageFit, DEFAULT_TEMPLATES.imageFit),
    imageRatio: pick(IMAGERATIO, t.imageRatio, DEFAULT_TEMPLATES.imageRatio),
    accountLayout: pick(
      ACCOUNTLAYOUT,
      t.accountLayout,
      DEFAULT_TEMPLATES.accountLayout,
    ),
    contentLayout: pick(
      CONTENTLAYOUT,
      t.contentLayout,
      DEFAULT_TEMPLATES.contentLayout,
    ),
    cartLayout: pick(CARTLAYOUT, t.cartLayout, DEFAULT_TEMPLATES.cartLayout),
    shell: pick(SHELL, t.shell, DEFAULT_TEMPLATES.shell),
    // Not a `pick` over a local map, unlike every line above it: the mobile
    // options are a registry in `lib/storefront-mobile.ts` so that adding one is
    // a single object there. `mobileTemplate` is that registry's own narrowing —
    // it falls back to the default template for an unknown id, which is exactly
    // what `pick` does for the fixed axes.
    mobile: mobileTemplate(t.mobile).id,
  };
}

/** `templates.imageFit` → the `<Media fit>` value it drives. */
export function mediaFitFor(imageFit: StoreTemplates["imageFit"]): "cover" | "canvas" {
  return imageFit === "crop" ? "cover" : "canvas";
}

/**
 * Narrows a raw id to a known fit — the twin of `isImageRatio` below, and what
 * a PER-PHOTO override needs. A hero slide and the static banner each carry
 * their own `imageFit`, arriving as the same loose string the templates ids do,
 * so it must reach `mediaFitFor` through a guard rather than a cast. Anything
 * unknown falls through to the caller's default (`"fit"` for both), never to
 * `templates.imageFit` — a hero does not follow a *Product cards* control.
 */
export function isImageFit(value: unknown): value is StoreTemplates["imageFit"] {
  return typeof value === "string" && Object.hasOwn(IMAGEFIT, value);
}

/** Narrows a raw/draft id to a known ratio — the guard `useStoreImageRatio` uses. */
export function isImageRatio(value: unknown): value is StoreTemplates["imageRatio"] {
  return typeof value === "string" && Object.hasOwn(IMAGERATIO, value);
}

/**
 * `templates.imageRatio` → the `<Media ratio>` CSS value it drives. The ONLY
 * place this translation happens, mirroring `mediaFitFor` beside it.
 *
 * Aspect ratio is the strongest per-vertical signal a storefront has — portrait
 * reads as fashion, square as grocery — so it is deliberately a merchant choice
 * rather than something each surface hardcodes.
 */
export function mediaRatioFor(imageRatio: StoreTemplates["imageRatio"]): string {
  switch (imageRatio) {
    case "portrait":
      return "3 / 4";
    case "landscape":
      return "4 / 3";
    case "tall":
      return "2 / 3";
    default:
      return "1 / 1";
  }
}

/**
 * Resolve the card's CTA layout, falling back the way the card used to behave.
 *
 * Exported because the Customize live preview must resolve the same way against
 * its **draft** density — reading the saved one made the preview show two
 * buttons where a compact shop renders an inline "+".
 *
 * Until `cardActions` existed, `productCard: "compact"` hard-coded its own CTA —
 * a single inline "+" beside the price. That is now the `iconOnly` layout, so an
 * unset value on a compact store must resolve to it. Defaulting every store to
 * `addBuy` would put two text buttons on every compact card without the owner
 * choosing it — the same class of silent restyle `resolveHeaderMenu` avoids.
 */
export function resolveCardActions(
  raw: string | null | undefined,
  productCard: StoreTemplates["productCard"],
): StoreTemplates["cardActions"] {
  if (raw && raw in CARDACTIONS) {
    return CARDACTIONS[raw as keyof typeof CARDACTIONS];
  }
  return productCard === "compact" ? "iconOnly" : DEFAULT_TEMPLATES.cardActions;
}

/**
 * Resolve what the header's top links are built from.
 *
 * `templates.headerMenu` is the explicit, owner-chosen source. It is unset on
 * every store created before that control shipped, so the fallback reproduces
 * the old implicit behaviour — a non-empty custom menu used to win over the
 * category list — and only then lands on "collections". Defaulting straight to
 * "collections" would silently replace the header of every store that had
 * already built a menu.
 *
 * @param hasCustomMenu whether `nav.header` holds at least one item.
 */
export function resolveHeaderMenu(
  templates: StoreTemplatesRaw | undefined,
  hasCustomMenu: boolean,
): HeaderMenuSource {
  const raw = templates?.headerMenu;
  if (raw && raw in HEADER_MENU) return HEADER_MENU[raw as HeaderMenuSource];
  return hasCustomMenu ? "custom" : "collections";
}

/**
 * Clamp an owner-supplied number into the range the renderer can survive, or
 * fall back when it is absent/unparseable.
 *
 * The backend validator enforces the same bounds, so this is not the gate — it
 * exists because the **live preview** streams a half-typed draft that never
 * reaches the backend, and a merchant mid-way through typing "8" on their way
 * to "80" must not blow the header apart.
 */
function clampInt(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Logo chrome with the owner's overrides applied and bounded. */
export interface ResolvedLogoStyle {
  /** Absent ⇒ transparent, which is what every store had before this setting. */
  background?: string;
  padding: number;
  radius: number;
  /** Absent ⇒ the placement keeps its own default height. */
  height?: number;
}

/**
 * Resolve `theme.logo` (Customize → Brand) for the header/footer lockup.
 *
 * The defaults reproduce the pre-setting rendering exactly — no backdrop, no
 * padding, square corners, per-placement height — so a store whose owner has
 * never opened this control renders byte-for-byte as it did.
 */
export function resolveLogoStyle(
  raw: StoreLogoStyle | null | undefined,
): ResolvedLogoStyle {
  return {
    background: raw?.background?.trim() || undefined,
    padding: clampInt(raw?.padding, 0, 24, 0),
    radius: clampInt(raw?.radius, 0, 40, 0),
    height: raw?.height ? clampInt(raw.height, 20, 80, 0) : undefined,
  };
}

/** A category row's layout: tiles or names, strip or grid, and how many across. */
export interface CategoryRowOptions {
  /** `plain` draws names only; `card` is the picture tile. */
  style: "card" | "plain";
  layout: "strip" | "grid";
  /** Desktop columns in `grid`. A phone reads `mobileColumns` instead. */
  columns: number;
  /** Phone columns in `grid` (2–4). Both category grids honour it. */
  mobileColumns: number;
  align: "left" | "center" | "right";
  /**
   * The merchant's PREFERENCE, not the answer. Whether the names actually come
   * off also depends on the catalogue having a picture for every listed
   * category — `categoryLabelsVisible` below is where the two meet, and the
   * only thing a row should ask.
   */
  showLabels: boolean;
}

/**
 * Does this row draw its category NAMES?
 *
 * Two inputs, and the second is the one that matters: a merchant can ask for a
 * pictures-only row, but a category with no image renders as a letter tile, and
 * a letter with no name under it is not a wayfinding target — it is a mystery
 * box where a department should be. So the preference is honored only when the
 * whole row is photographed.
 *
 * ⚠ **Asked ONCE per section, never per tile.** Keeping the name on just the
 * unphotographed tiles would leave a row of mixed shapes, which is the same
 * mistake `CategoryTiles` already avoids when it asks `photographed` for the
 * whole section rather than tile by tile. One shape used consistently beats a
 * ragged row, even when the consistent one is not what was asked for.
 *
 * Lives here, in a module with no `"use client"`, because the Storefront
 * Builder's server views ask this too — a server component cannot call a
 * function exported from a client module.
 */
export function categoryLabelsVisible(
  showLabels: boolean,
  allPhotographed: boolean,
): boolean {
  return showLabels || !allPhotographed;
}
