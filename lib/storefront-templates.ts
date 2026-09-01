// coding-standard: maintained
import type {
  HeaderMenuSource,
  StoreHomeCollections,
  StoreHomeSection,
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
  imageFit: "fit",
  imageRatio: "square",
  categoryTiles: "tile",
  accountLayout: "sidebar",
  contentLayout: "centered",
  cartLayout: "panel",
  shell: "stacked",
};

// The admin Templates tab stores ids like "grid-4" / "gallery-left" / "multi-step";
// the storefront pages consume short variant names. These maps bridge the two.
const HOME = { classic: "classic", "hero-split": "hero-split", minimal: "minimal" } as const;
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
const HERO = { slides: "slides", banner: "banner" } as const;
const HEADER_MENU = { collections: "collections", custom: "custom" } as const;
// How product listings advance past page 1. `pages` stays the default: it is what
// every existing store already renders, and it is the only mode that puts a real
// paginated crawl path in the HTML without help.
const PAGINATION = { pages: "pages", infinite: "infinite", "load-more": "loadMore" } as const;
const IMAGEFIT = { fit: "fit", crop: "crop" } as const;
// The FRAME a product photo sits in, orthogonal to IMAGEFIT (which decides what
// happens to a photo that doesn't match the frame). `square` stays the default:
// it is what every store rendered before this existed.
const IMAGERATIO = {
  square: "square",
  portrait: "portrait",
  landscape: "landscape",
  tall: "tall",
} as const;
// How `category-tiles` presents one department. `tile` is the default because it
// is what the section has always rendered; `overlay` needs real photographs on
// every category, so making it the fallback would put a scrim over a grid of
// letter placeholders.
// `circle` is `disc`'s shape with `tile`'s content: the merchant's photograph
// cropped round, the name beneath. The two existing photo modes are both
// rectangles, so a soft catalogue (baby, gifts, beauty) had no way to lose the
// corners without also losing the pictures — `disc` refuses photographs by
// design. A category with no photo falls back to the lettered disc, which is
// the same circle, so a half-photographed catalogue stays one consistent row.
const CATEGORYTILES = {
  tile: "tile",
  overlay: "overlay",
  disc: "disc",
  circle: "circle",
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
    imageFit: pick(IMAGEFIT, t.imageFit, DEFAULT_TEMPLATES.imageFit),
    imageRatio: pick(IMAGERATIO, t.imageRatio, DEFAULT_TEMPLATES.imageRatio),
    categoryTiles: pick(
      CATEGORYTILES,
      t.categoryTiles,
      DEFAULT_TEMPLATES.categoryTiles,
    ),
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

/**
 * Turn a preset's bare section ids into instances, minting keys from the id and
 * its position.
 *
 * **Deterministic, never random.** The same preset must mint the same keys every
 * time: keys are what per-section config joins on, and what `isThemeModified`
 * compares. A `crypto.randomUUID()` here would re-key on every render, so a
 * merchant's config would detach from its section and a freshly applied theme
 * would report itself as edited one second later.
 *
 * The index is in the key because a preset may legitimately repeat a type.
 */
export function sectionInstances(types: readonly string[]): StoreHomeSection[] {
  return types.map((type, i) => ({ key: `${type}-${i}`, type }));
}

/**
 * The homepage's sections, in render order.
 *
 * Precedence: the Customize draft (live preview) → the merchant's saved
 * `theme.homepageSections` → the default composition for their `templates.home`
 * → Classic. So a store that has never touched Sections renders exactly the page
 * its home template always produced, and one that has reordered them keeps that
 * order even after switching template.
 *
 * Unknown TYPES are dropped rather than rendered: a retired section, or one from
 * a newer build, must not reach `SECTION_COMPONENTS[type]` and blow up the page.
 * The caller passes the registry's guard so this module stays free of component
 * imports — `lib/` must not depend on `components/`.
 */
export function resolveSections(
  store: Pick<StorefrontStore, "theme" | "templates"> | null | undefined,
  options: {
    draft?: StoreHomeSection[] | null;
    isSectionId: (value: unknown) => boolean;
    presets: Record<string, readonly string[]>;
  },
): StoreHomeSection[] {
  const { draft, isSectionId, presets } = options;
  const saved = store?.theme?.homepageSections;
  const home = pick(HOME, store?.templates?.home, DEFAULT_TEMPLATES.home);
  const fallback = sectionInstances(presets[home] ?? presets.classic ?? []);
  const chosen =
    (draft?.length ? draft : undefined) ??
    (saved?.length ? saved : undefined) ??
    fallback;
  // `entry?.type` rather than `entry.type`: `chosen` comes off a stored document
  // and a store written before instances holds bare strings, where `.type` is
  // `undefined` — dropped by the guard, which is what makes the fallback below
  // catch the whole legacy shape instead of throwing on it.
  const known = chosen.filter((entry) => isSectionId(entry?.type));
  // ⚠ If NOTHING survives the filter, fall back rather than returning `[]` — an
  // empty list renders a blank homepage. This is not theoretical: every seeded
  // store carried four ids from the pre-registry catalogue (`banner`,
  // `featured`, `categories`, `products`) that no section ever answered to, so
  // the strict version would have blanked the homepage of every demo shop while
  // leaving stores with an unset value working perfectly. The same guard now
  // absorbs a store still holding the pre-instance `string[]`.
  return known.length ? known : fallback.filter((entry) => isSectionId(entry.type));
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

/** Homepage collections row layout with the owner's overrides applied. */
export interface ResolvedHomeCollections {
  layout: "strip" | "grid";
  /** Desktop columns in `grid`. Narrow screens pin to 2 — see storefront.css. */
  columns: number;
  align: "left" | "center" | "right";
  /**
   * The merchant's PREFERENCE, not the answer. Whether the names actually come
   * off also depends on the catalogue having a picture for every listed
   * category — `categoryLabelsVisible` in `home/category-row-layout.ts` is
   * where the two meet, and the only thing a row should ask.
   */
  showLabels: boolean;
}

/**
 * Resolve `theme.homeCollections` (Customize → Home page → Collections row).
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
    // Only an explicit `false` hides the names. Anything else — unset, null, a
    // string that survived an old payload — is the shop that has never been
    // asked, and that shop shows its category names.
    showLabels: raw?.showLabels !== false,
  };
}
