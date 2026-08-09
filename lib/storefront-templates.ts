// coding-standard: maintained
import type {
  HeaderMenuSource,
  StoreHomeCollections,
  StoreLogoStyle,
  StoreTemplates,
  StoreTemplatesRaw,
  StorefrontStore,
} from "@/lib/storefront-client";

/** Default page variants when the store hasn't selected one (or backend omits it). */
export const DEFAULT_TEMPLATES: StoreTemplates = {
  home: "classic",
  collection: "grid4",
  product: "left",
  checkout: "single",
  footer: "columns",
  header: "classic",
  productCard: "standard",
  cardActions: "addBuy",
  hero: "slides",
  pagination: "pages",
};

// The admin Templates tab stores ids like "grid-4" / "gallery-left" / "multi-step";
// the storefront pages consume short variant names. These maps bridge the two.
const HOME = { classic: "classic", "hero-split": "hero-split", minimal: "minimal" } as const;
const COLLECTION = { "grid-3": "grid3", "grid-4": "grid4", sidebar: "sidebar" } as const;
const PRODUCT = { "gallery-left": "left", "gallery-top": "top", "sticky-bar": "sticky" } as const;
const CHECKOUT = { "single-page": "single", "multi-step": "multi" } as const;
const FOOTER = { columns: "columns", simple: "simple", rich: "rich" } as const;
const HEADER = { classic: "classic", minimal: "minimal", centered: "centered" } as const;
const PRODUCTCARD = { standard: "standard", compact: "compact", bold: "bold" } as const;
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
const HERO = { slides: "slides", banner: "banner" } as const;
const HEADER_MENU = { collections: "collections", custom: "custom" } as const;
// How product listings advance past page 1. `pages` stays the default: it is what
// every existing store already renders, and it is the only mode that puts a real
// paginated crawl path in the HTML without help.
const PAGINATION = { pages: "pages", infinite: "infinite", "load-more": "loadMore" } as const;

function pick<M extends Record<string, string>>(
  map: M,
  raw: string | undefined,
  fallback: M[keyof M],
): M[keyof M] {
  return (raw && map[raw]) ? (map[raw] as M[keyof M]) : fallback;
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
    home: pick(HOME, t.home, DEFAULT_TEMPLATES.home),
    collection: pick(COLLECTION, t.collection, DEFAULT_TEMPLATES.collection),
    product: pick(PRODUCT, t.product, DEFAULT_TEMPLATES.product),
    checkout: pick(CHECKOUT, t.checkout, DEFAULT_TEMPLATES.checkout),
    footer: pick(FOOTER, t.footer, DEFAULT_TEMPLATES.footer),
    header: pick(HEADER, t.header, DEFAULT_TEMPLATES.header),
    productCard,
    cardActions: resolveCardActions(t.cardActions, productCard),
    hero: pick(HERO, t.hero, DEFAULT_TEMPLATES.hero),
    pagination: pick(PAGINATION, t.pagination, DEFAULT_TEMPLATES.pagination),
  };
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

/** Homepage collections row layout with the owner's overrides applied. */
export interface ResolvedHomeCollections {
  layout: "strip" | "grid";
  /** Desktop columns in `grid`. Narrow screens pin to 2 — see storefront.css. */
  columns: number;
  align: "left" | "center" | "right";
}

/**
 * Resolve `theme.homeCollections` (Customize → Collections).
 *
 * `strip` is the default because it is what the row has always been; switching
 * the fallback to `grid` would restyle every existing homepage without its
 * owner asking, which is the same trap `resolveHeaderMenu` documents.
 */
export function resolveHomeCollections(
  raw: StoreHomeCollections | null | undefined,
): ResolvedHomeCollections {
  return {
    layout: raw?.layout === "grid" ? "grid" : "strip",
    columns: clampInt(raw?.columns, 2, 6, 4),
    align:
      raw?.align === "center" || raw?.align === "right" ? raw.align : "left",
  };
}
