import type {
  HeaderMenuSource,
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
  return {
    home: pick(HOME, t.home, DEFAULT_TEMPLATES.home),
    collection: pick(COLLECTION, t.collection, DEFAULT_TEMPLATES.collection),
    product: pick(PRODUCT, t.product, DEFAULT_TEMPLATES.product),
    checkout: pick(CHECKOUT, t.checkout, DEFAULT_TEMPLATES.checkout),
    footer: pick(FOOTER, t.footer, DEFAULT_TEMPLATES.footer),
    header: pick(HEADER, t.header, DEFAULT_TEMPLATES.header),
    productCard: pick(PRODUCTCARD, t.productCard, DEFAULT_TEMPLATES.productCard),
    hero: pick(HERO, t.hero, DEFAULT_TEMPLATES.hero),
    pagination: pick(PAGINATION, t.pagination, DEFAULT_TEMPLATES.pagination),
  };
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
