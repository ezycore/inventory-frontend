import type {
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";

/** Default page variants when the store hasn't selected one (or backend omits it). */
export const DEFAULT_TEMPLATES: StoreTemplates = {
  home: "classic",
  collection: "grid4",
  product: "left",
  checkout: "single",
  cart: "page",
  search: "grid",
  footer: "columns",
  header: "classic",
  productCard: "standard",
  hero: "slides",
};

// The admin Templates tab stores ids like "grid-4" / "gallery-left" / "multi-step";
// the storefront pages consume short variant names. These maps bridge the two.
const HOME = { classic: "classic", "hero-split": "hero-split", minimal: "minimal" } as const;
const COLLECTION = { "grid-3": "grid3", "grid-4": "grid4", sidebar: "sidebar" } as const;
const PRODUCT = { "gallery-left": "left", "gallery-top": "top", "sticky-bar": "sticky" } as const;
const CHECKOUT = { "single-page": "single", "multi-step": "multi" } as const;
const CART = { "two-column": "page", drawer: "drawer" } as const;
const SEARCH = { grid: "grid", list: "list" } as const;
const FOOTER = { columns: "columns", simple: "simple", rich: "rich" } as const;
const HEADER = { classic: "classic", minimal: "minimal", centered: "centered" } as const;
const PRODUCTCARD = { standard: "standard", compact: "compact", bold: "bold" } as const;
const HERO = { slides: "slides", banner: "banner" } as const;

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
    cart: pick(CART, t.cart, DEFAULT_TEMPLATES.cart),
    search: pick(SEARCH, t.search, DEFAULT_TEMPLATES.search),
    footer: pick(FOOTER, t.footer, DEFAULT_TEMPLATES.footer),
    header: pick(HEADER, t.header, DEFAULT_TEMPLATES.header),
    productCard: pick(PRODUCTCARD, t.productCard, DEFAULT_TEMPLATES.productCard),
    hero: pick(HERO, t.hero, DEFAULT_TEMPLATES.hero),
  };
}
