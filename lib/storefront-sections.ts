// coding-standard: maintained
/**
 * Per-section homepage config (`sectionConfig`) turned into something
 * renderable — Customize → Home page → Sections.
 *
 * A product section renders its built-in source until the merchant configures
 * it. Once they do, this module owns the three questions that must be answered
 * IDENTICALLY on the server (SSR) and in the Customize preview (client): which
 * products a section asks the catalogue for, what its heading says, and where
 * "View all" goes.
 *
 * It deliberately does NOT fetch. The server page and the preview use different
 * transports (`lib/storefront-server` vs the client hooks) and only the query is
 * shared — a fetch in here would drag one of them into the other's caching
 * model.
 *
 * The config is a SIBLING of `theme` and never a member of it: applying a
 * ready-made theme replaces `theme.homepageSections` outright, so a merchant's
 * chosen collection stored in there would be erased every time they tried a
 * look. See `StorefrontSectionConfig` on the backend.
 */

import type {
  CatalogCategory,
  StoreHomeSection,
  StoreSectionCard,
  StoreSectionConfig,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";

/** Products a section asks for when the merchant hasn't chosen (matches the editor). */
export const DEFAULT_SECTION_LIMIT = 8;
export const MIN_SECTION_LIMIT = 4;
export const MAX_SECTION_LIMIT = 12;

/**
 * Category promo cards a row advertises before the merchant picks any.
 *
 * Shared because BOTH sides count on it: the section renders the first two, and
 * the editor's hints have to describe the cards actually on screen — which,
 * with nothing picked, are those same two. Two copies of this number is two
 * hints that disagree with the shop the moment either moves.
 */
export const DEFAULT_BANNER_COUNT = 2;
/** Mirrors `categoryIds` in the backend validator — a fifth card wraps alone. */
export const MAX_BANNER_COUNT = 4;

const clampLimit = (n: number | undefined) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(MAX_SECTION_LIMIT, Math.max(MIN_SECTION_LIMIT, Math.round(n)))
    : DEFAULT_SECTION_LIMIT;

/**
 * What a section's config PICKS, for the sections that have one.
 *
 * Three kinds, because three different controls answer them and only one of
 * them costs a request: a product row is configured by source and earns a
 * catalogue query per instance; a tag row and a promo-card row are configured by
 * picking from lists the page already has, so they cost nothing extra. That
 * distinction is why this is a kind rather than a boolean — it was two
 * overlapping sets (`CONFIGURABLE` and `TAG_CONFIGURABLE`) until a third
 * section needed a third control, at which point the sets were answering
 * "which editor?" and "does it fetch?" at the same time and agreeing only by
 * accident.
 *
 * A section absent here ignores config entirely.
 */
export type SectionConfigKind = "products" | "tags" | "categories";

const CONFIG_KIND: Record<string, SectionConfigKind> = {
  "featured-grid": "products",
  "product-rail": "products",
  "minimal-picks": "products",
  "tag-chips": "tags",
  "category-banners": "categories",
};

export const sectionConfigKind = (
  type: string,
): SectionConfigKind | undefined => CONFIG_KIND[type];

/** How a `category-banners` card arranges its photograph against its copy. */
export type SectionCardShape = "stacked" | "split";

/**
 * The promo card's composition, with the unset case decided in ONE place.
 *
 * Only an explicit `split` moves the picture beside the copy. Anything else —
 * unset, null, a value from an older payload — is a shop that has never been
 * asked, and it draws the stacked card every row drew before the choice
 * existed. The same rule `resolveHomeCollections` follows, for the same reason:
 * flipping the fallback would restyle every existing homepage without its owner
 * touching anything.
 *
 * Shared because the storefront and the editor must not disagree about what
 * "unset" looks like — the editor's selected pill and the rendered card are the
 * same answer shown twice.
 */
export const resolveCardShape = (
  config: { cardShape?: string | null } | null | undefined,
): SectionCardShape => (config?.cardShape === "split" ? "split" : "stacked");

/** The promo photo's shapes, in the order a merchant meets them. */
export const CARD_RATIOS = ["16:9", "4:3", "1:1", "3:4"] as const;
export type SectionCardRatio = (typeof CARD_RATIOS)[number];

const CARD_RATIO_SET: ReadonlySet<string> = new Set(CARD_RATIOS);

/**
 * The promo photo's shape, or `undefined` for "the composition decides".
 *
 * ⚠ **Unset is a real answer and must stay one.** A stacked card runs 16:9 and
 * a split card 4:3, and a phone overrides both again — those defaults live in
 * `storefront.css` where the breakpoint can see them. Resolving unset to a
 * literal here would freeze a shop that never chose at whatever the desktop
 * value happens to be, and the phone rules would stop applying. So this only
 * validates: a recognised value passes through, anything else falls back to the
 * stylesheet's own answer.
 */
export const resolveCardRatio = (
  config: { cardRatio?: string | null } | null | undefined,
): SectionCardRatio | undefined =>
  typeof config?.cardRatio === "string" && CARD_RATIO_SET.has(config.cardRatio)
    ? (config.cardRatio as SectionCardRatio)
    : undefined;

/** `"16:9"` as CSS writes it. The stored value is the merchant-facing form. */
export const cardRatioValue = (ratio: SectionCardRatio): string =>
  ratio.replace(":", " / ");

/* ------------------------------ card height ------------------------------ */

export const MIN_CARD_HEIGHT = 20;
export const MAX_CARD_HEIGHT = 800;

/**
 * The picture's height in pixels, or `undefined` for "the shape decides".
 *
 * ⚠ **A ratio cannot express a height, which is why this exists.** `cardRatio`
 * ties the picture's height to the card's WIDTH, and the width is decided by
 * how many collections the merchant picked (`auto-fit`) — so "a thin strip
 * across the page" was not sayable at all: even 16:9 gives a two-up row ~330px
 * of picture. Setting a height wins over the ratio; clearing it hands the shape
 * back.
 *
 * Clamped rather than rejected, same as the split width: a number out of range
 * is a merchant who wanted something extreme, and the nearest legal answer is
 * closer to what they meant than silently ignoring them.
 */
export const resolveCardHeight = (
  config: { cardHeight?: number | null } | null | undefined,
): number | undefined => {
  const raw = config?.cardHeight;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, Math.round(raw)));
};

/**
 * The picture size a promo card actually wants, for the upload hint.
 *
 * **Derived from the merchant's own settings, not a constant**, because on this
 * block there is no single right answer: a stacked 16:9 card wants a wide
 * landscape photograph, a split card at 25% wants something nearly square and
 * a third the width, and a fixed 20px height wants a banner strip. A static
 * "600 × 600" would be wrong for most of the combinations the panel offers, and
 * a hint that is usually wrong is worse than none — merchants learn to ignore
 * it and then ignore the one that mattered.
 *
 * Sized for the DESKTOP card at 2× — the larger of the two screens, so the same
 * file serves the phone. `CARD_REF_WIDTH` is a two-up row on a ~1200px page
 * (~590px) doubled for retina.
 */
const CARD_REF_WIDTH = 1200;

const RATIO_VALUE: Record<SectionCardRatio, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
};

export const recommendedCardImage = (config: {
  shape: SectionCardShape;
  split: number | undefined;
  ratio: SectionCardRatio | undefined;
  height: number | undefined;
}): { w: number; h: number } => {
  const share =
    config.shape === "split" ? (config.split ?? 45) / 100 : 1;
  const w = Math.round(CARD_REF_WIDTH * share);
  // An explicit height wins over the shape, exactly as it does on the card.
  if (config.height) return { w, h: config.height * 2 };
  const ratio = RATIO_VALUE[config.ratio ?? (config.shape === "split" ? "4:3" : "16:9")];
  return { w, h: Math.round(w / ratio) };
};

/* ------------------------------- card side ------------------------------- */

/** Where the picture sits on a split card, in the order a merchant meets them. */
export const CARD_SIDES = ["left", "right", "alternate"] as const;
export type SectionCardSide = (typeof CARD_SIDES)[number];

const CARD_SIDE_SET: ReadonlySet<string> = new Set(CARD_SIDES);

/**
 * Which side the picture sits on, defaulting to `left`.
 *
 * ⚠ **`alternate` is a value here, not the whole setting.** This replaced a
 * boolean called `cardAlternate` whose only offer was the zebra, which is not
 * what a merchant means by "swap the picture and the words" — they mean every
 * card, and the switch could not do it. Reading through a resolver (rather than
 * comparing the raw field at each call site) is what keeps the editor's
 * selected chip and the rendered card agreeing about what unset looks like.
 */
export const resolveCardSide = (
  config: { cardSide?: string | null } | null | undefined,
): SectionCardSide =>
  typeof config?.cardSide === "string" && CARD_SIDE_SET.has(config.cardSide)
    ? (config.cardSide as SectionCardSide)
    : "left";

/**
 * How many cards across, narrowed. `undefined` ⇒ the screen's own rule.
 *
 * Clamped rather than rejected, like the split width: a number out of range is
 * a merchant who wanted more or fewer, and the nearest legal answer is closer to
 * what they meant than the default.
 */
const clampPerRow = (n: number | null | undefined): number | undefined =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(4, Math.max(1, Math.round(n)))
    : undefined;

/**
 * The card's corner radius in px, or `undefined` for the shop's own corners.
 *
 * ⚠ Unset is the right answer for nearly every shop: corners are a BRAND
 * decision, set once in Design → Corners and applied to every card, panel and
 * field in the storefront. This exists for the row that deliberately differs —
 * a full-width photographic band with square corners under a shop of rounded
 * cards — and defaulting it to anything would quietly opt every row out of the
 * theme.
 */
export const resolveCardRadius = (
  config: { cardRadius?: number | null } | null | undefined,
): number | undefined => {
  const raw = config?.cardRadius;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return Math.min(40, Math.max(0, Math.round(raw)));
};

/* ------------------------------ split width ------------------------------ */

/**
 * The picture column's share of a split card, as the panel offers it.
 *
 * Discrete steps rather than a slider: the rail is 380px, a slider there is a
 * drag target inside a scrolling page, and no shop needs 63% specifically. The
 * bounds match the validator's 20–80.
 */
export const CARD_SPLITS = [25, 35, 50, 65, 75] as const;

export const MIN_CARD_SPLIT = 20;
export const MAX_CARD_SPLIT = 80;

/**
 * The picture's share of the card, or `undefined` for "the breakpoint decides".
 *
 * ⚠ **Unset is a real answer.** The built-in widths are not one number: a phone
 * runs the picture as a clamped thumbnail and a desktop runs it as a near-even
 * column, and both live in `storefront.css` where the breakpoint can see them.
 * Resolving unset to a literal here would freeze a shop that never chose at
 * whichever value the desktop happens to use. Same rule as `resolveCardRatio`.
 *
 * Clamped rather than rejected when out of range: a number that arrived too
 * large is a merchant who wanted the picture wide, and the nearest legal answer
 * is closer to what they meant than the default is.
 */
export const resolveCardSplit = (
  config: { cardSplit?: number | null } | null | undefined,
): number | undefined => {
  const raw = config?.cardSplit;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return Math.min(MAX_CARD_SPLIT, Math.max(MIN_CARD_SPLIT, Math.round(raw)));
};

/** The picture column's width as CSS writes it. */
export const cardSplitValue = (split: number): string => `${split}%`;

/**
 * One card's overrides, or `undefined` when the merchant has written none.
 *
 * Shared so the editor and the storefront read the same entry the same way —
 * the panel shows the collection's own name and description as the PLACEHOLDER
 * under each box, which is only honest if both sides agree that a blank field
 * means "fall back", not "print nothing".
 */
export const sectionCard = (
  config: { cards?: StoreSectionCard[] } | null | undefined,
  categoryId: string,
): StoreSectionCard | undefined =>
  config?.cards?.find((card) => card.categoryId === categoryId);

/* --------------------------- per-device layout --------------------------- */

/** The two screens a promo-card row is composed for. */
export const CARD_DEVICES = ["desktop", "mobile"] as const;
export type SectionCardDevice = (typeof CARD_DEVICES)[number];

/** One screen's answer to how a promo card is built. */
/** The two ways a row can arrange its cards. */
export const CARD_FLOWS = ["wrap", "scroll"] as const;
export type SectionCardFlow = (typeof CARD_FLOWS)[number];

/** How many cards a row may put across, as the panel offers it. */
export const CARD_PER_ROW = [1, 2, 3, 4] as const;

export interface BannerLayout {
  shape: SectionCardShape;
  side: SectionCardSide;
  /** `undefined` ⇒ the stylesheet's own column width for that breakpoint. */
  split: number | undefined;
  hideText: boolean;
  /** `undefined` ⇒ the picture follows `cardRatio` instead. */
  height: number | undefined;
  /** A grid, or a horizontal track the shopper swipes. */
  flow: SectionCardFlow;
  /** `undefined` ⇒ each screen's own rule (desktop `auto-fit`, phone one up). */
  perRow: number | undefined;
}

/**
 * How the card is composed on each screen.
 *
 * **The desktop values are the row's, and the phone inherits every one it has
 * not been given its own answer for.** So a merchant who never opens the Mobile
 * tab has one design on both screens — which is what every row had before this
 * split existed — and one who opens it overrides only the thing they changed.
 *
 * ⚠ **Resolved once, for BOTH screens, on the server.** A storefront page is
 * rendered without a viewport, so the component cannot ask which screen it is
 * on: it emits both answers and the stylesheet's breakpoint picks. That is why
 * this returns a pair rather than taking a device argument — a caller that
 * could ask for one would be a caller that had to know the viewport.
 *
 * Shared with the editor so its Desktop and Mobile tabs show exactly what the
 * shop will draw, inheritance included.
 */
export const resolveBannerLayout = (
  config:
    | (Pick<
        StoreSectionConfig,
        | "cardShape"
        | "cardSide"
        | "cardSplit"
        | "cardHideText"
        | "cardHeight"
        | "cardFlow"
        | "cardPerRow"
      > & {
        mobile?: StoreSectionConfig["mobile"];
      })
    | null
    | undefined,
): Record<SectionCardDevice, BannerLayout> => {
  const desktop: BannerLayout = {
    shape: resolveCardShape(config),
    side: resolveCardSide(config),
    split: resolveCardSplit(config),
    hideText: config?.cardHideText === true,
    height: resolveCardHeight(config),
    flow: config?.cardFlow === "scroll" ? "scroll" : "wrap",
    perRow: clampPerRow(config?.cardPerRow),
  };
  const m = config?.mobile;
  return {
    desktop,
    mobile: {
      shape: m?.cardShape ? resolveCardShape(m) : desktop.shape,
      side: m?.cardSide ? resolveCardSide(m) : desktop.side,
      split: m?.cardSplit === undefined ? desktop.split : resolveCardSplit(m),
      hideText: m?.cardHideText === undefined ? desktop.hideText : m.cardHideText === true,
      height: m?.cardHeight === undefined ? desktop.height : resolveCardHeight(m),
      flow: m?.cardFlow === undefined ? desktop.flow : m.cardFlow === "scroll" ? "scroll" : "wrap",
      perRow: m?.cardPerRow === undefined ? desktop.perRow : clampPerRow(m.cardPerRow),
    },
  };
};

/**
 * Strip a phone override block back to what it actually answers.
 *
 * An empty `mobile` object is a merchant who opened the tab and changed
 * nothing, and storing it would make "inherits the desktop" indistinguishable
 * from "was asked and said the same" — the rule `cardShape` and `cardHasOverrides`
 * both already follow. Returns `undefined` when nothing is left.
 */
export const mobileCardOverrides = (
  mobile: StoreSectionConfig["mobile"],
): StoreSectionConfig["mobile"] => {
  if (!mobile) return undefined;
  const kept = Object.entries(mobile).filter(([, v]) => v !== undefined && v !== null);
  return kept.length
    ? (Object.fromEntries(kept) as StoreSectionConfig["mobile"])
    : undefined;
};

/**
 * Is there anything on this row's config worth keeping?
 *
 * The editor drops a config entry that records nothing — an object holding only
 * its own `key` is a saved trace of a merchant deciding nothing, and it would
 * put the row outside any future change to what the defaults mean.
 *
 * ⚠ **Asked of every field, not of a hand-written list, and that is the point.**
 * The panel used to decide this with `chosen.length > 0 || config.title`, which
 * was true of the two settings that existed when it was written. It silently
 * became data loss as the row grew: a merchant who had set Full width and a
 * picture shape but picked no collections lost both by pressing "Photo on top",
 * because neither field was in the list. Walking the object means a setting
 * added next month is protected the day it is added rather than the day someone
 * notices.
 *
 * `ignore` is the field the caller is in the middle of clearing — it is about
 * to be `undefined`, so counting its current value would keep the entry alive
 * on the strength of the thing being removed.
 */
export const configHasSettings = (
  config: StoreSectionConfig | null | undefined,
  ignore?: keyof StoreSectionConfig,
): boolean => {
  if (!config) return false;
  return Object.entries(config).some(([field, value]) => {
    if (field === "key" || field === ignore) return false;
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    /* `mobile: {}` is a merchant who opened the phone tab and changed nothing.
       Counting it would keep an otherwise-empty config alive on the strength of
       a block that answers no question. */
    if (typeof value === "object") return Object.values(value).some((v) => v !== undefined);
    return true;
  });
};

/**
 * Is there anything left on this card worth storing?
 *
 * A card whose every field is blank is a merchant who opened the box and typed
 * nothing, and storing that makes "never touched" indistinguishable from
 * "cleared it back" — the same rule `cardShape` follows when it drops itself
 * rather than saving `"stacked"`.
 */
export const cardHasOverrides = (card: StoreSectionCard): boolean =>
  !!(
    card.title?.trim() ||
    card.description?.trim() ||
    card.buttonLabel?.trim() ||
    card.buttonHref?.trim() ||
    card.image
  );

/**
 * Does this section earn a catalogue fetch? Only a product row does — which is
 * what `configuredSections` walks. A tag or promo-card row renders from data
 * the homepage already loaded, and adding one here would cost every shop that
 * composes it an extra round trip for products it never shows.
 */
export const isConfigurableSection = (type: string) =>
  CONFIG_KIND[type] === "products";

/**
 * One section's config, by key.
 *
 * **Orphans are ignored, never an error.** An entry whose key has left
 * `homepageSections` simply matches nothing — the backend keeps it on purpose,
 * because a PATCH may carry one array without the other and pruning would
 * delete the config of a section the merchant is halfway through re-adding.
 */
export function configFor(
  config: StoreSectionConfig[] | undefined,
  key: string,
): StoreSectionConfig | undefined {
  return config?.find((c) => c.key === key);
}

/**
 * Fold the config a DEFAULT composition implies under the merchant's own.
 *
 * A preset (and a ready-made theme) may now describe a configured row — "a
 * product grid, sourced newest" — rather than only naming a section type. That
 * implied config has to reach the page exactly the way a stored one does, or
 * the section renders its bare built-in source and the row silently changes
 * meaning.
 *
 * **The merchant's entry always wins.** A default that could overwrite an edit
 * is not a default. The two lists join on `key`, which is safe only because
 * `sectionInstances` mints both halves together — a config keyed by hand would
 * drift from its section and quietly do nothing.
 */
export function mergeSectionConfig(
  implied: readonly StoreSectionConfig[],
  own: readonly StoreSectionConfig[] | undefined,
): StoreSectionConfig[] {
  const mine = own ? [...own] : [];
  if (!implied.length) return mine;
  const claimed = new Set(mine.map((c) => c.key));
  return [...implied.filter((c) => !claimed.has(c.key)), ...mine];
}

/**
 * Find a section's collection in the store's category tree, and say which level
 * it sits at. The tree is exactly two deep and top-level nodes carry
 * `children`, so this needs no extra request — the homepage already has it.
 */
export function findSectionCategory(
  categories: CatalogCategory[],
  categoryId: string | undefined,
): { category: CatalogCategory; isSubcategory: boolean } | null {
  if (!categoryId) return null;
  const top = categories.find((c) => c._id === categoryId);
  if (top) return { category: top, isSubcategory: false };
  for (const parent of categories) {
    const child = parent.children?.find((c) => c._id === categoryId);
    if (child) return { category: child, isSubcategory: true };
  }
  return null;
}

/**
 * The catalogue query one configured section makes. `null` when it cannot
 * resolve — a collection the merchant has since deleted — which the caller
 * renders as no row at all rather than as an empty heading.
 *
 * Two rules are load-bearing:
 *
 * - **`inStock` on every row.** The homepage is a shop window and a card nobody
 *   can buy is dead space in the few slots that decide whether a visitor goes
 *   any further. (Collection and search pages deliberately keep listing
 *   sold-out products — there the shopper is browsing a catalogue.) It keeps
 *   `backorder` products, which sit at zero stock on purpose and still sell.
 * - **`sort: "newest"` is REQUIRED on a `newest` row**, not a tidy-up. The
 *   catalogue's default sort is `{ storefront.featured: -1, createdAt: -1 }` —
 *   featured first — which is right for a collection and wrong for a row headed
 *   "New arrivals": omitting it made the row open with the same products, in
 *   the same order, as the Featured row above it.
 *
 * A `category` row deliberately leaves `sort` unset, taking that featured-first
 * default: the merchant's own picks are exactly what should lead a collection's
 * shop-window row.
 *
 * The level matters because of how products are denormalized — `categoryId` is
 * the TOP-LEVEL category and `subcategoryId` its child. So a top-level row
 * filters on `categoryId` and sweeps in every child's products, while a
 * sub-collection row has to filter on `subcategoryId`; sending a child's id as
 * `categoryId` matches nothing and renders an empty row.
 */
export function sectionQuery(
  config: StoreSectionConfig,
  categories: CatalogCategory[],
): Record<string, string | number> | null {
  const limit = clampLimit(config.limit);
  /* A hand-picked row asks for exactly its picks and nothing else. `limit` is
     the picked count, NOT `clampLimit` — that clamps to 4-12, and this list is
     the row's length rather than a pool it draws from, so a merchant who picked
     three would silently get a fourth product they never chose. */
  if (config.source === "manual") {
    const ids = config.productIds ?? [];
    if (ids.length === 0) return null;
    return { ids: ids.join(","), limit: ids.length, inStock: "1" };
  }
  if (config.source === "featured") return { featured: "true", limit, inStock: "1" };
  if (config.source === "newest") return { limit, sort: "newest", inStock: "1" };
  if (config.source !== "category") return null;
  const found = findSectionCategory(categories, config.categoryId);
  if (!found) return null;
  return found.isSubcategory
    ? { subcategoryId: found.category._id, limit, inStock: "1" }
    : { categoryId: found.category._id, limit, inStock: "1" };
}

/**
 * What a section ASKS FOR, as a string — everything that changes its products,
 * and nothing that doesn't.
 *
 * The Customize preview matches draft sections against the server-rendered ones
 * on this, not on `key`: a merchant who re-points a row from Featured to a
 * collection keeps the same key, and matching on key alone would go on showing
 * the old row's products under the new heading. `title` is absent on purpose —
 * renaming a row must not throw away products the server already fetched.
 */
export function sectionSignature(config: StoreSectionConfig): string {
  // `productIds` is in here for the same reason `categoryId` is: changing the
  // picks changes the products, so a preview matching on the old signature
  // would draw the previous selection under the new one. The CTA fields are
  // deliberately OUT, alongside `title` — re-labelling a button must not throw
  // away products the server already fetched.
  const picks = config.productIds?.join(",") ?? "";
  return `${config.source ?? ""}:${config.categoryId ?? ""}:${clampLimit(config.limit)}:${picks}`;
}

/**
 * Put a hand-picked row's products back into the merchant's order.
 *
 * The query sends ids to `$in`, which returns them in whatever order the index
 * yields — so without this a curated row is a curated SET, and the merchant's
 * lead product lands wherever Mongo felt like putting it. Ordering is the whole
 * difference between a merchant picking eight products and picking a sequence.
 *
 * Products whose id is not in the list keep their relative position at the end,
 * so a non-manual row passed through here is unchanged.
 */
export function orderByIds<T extends { _id: string }>(
  products: T[],
  ids: string[] | undefined,
): T[] {
  if (!ids?.length) return products;
  const rank = new Map(ids.map((id, i) => [id, i]));
  return [...products].sort(
    (a, b) =>
      (rank.get(a._id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b._id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * A configured section's heading. A merchant title wins; blank falls back to
 * wording that follows the SHOPPER's language — the dictionary for the two
 * catalogue-wide sources, and the collection's own name for a category row.
 *
 * A typed title is one string and cannot be translated, which is why blank is
 * the better default rather than a migration that fills every row in.
 */
export function sectionTitle(
  config: StoreSectionConfig,
  t: Dict,
  categories: CatalogCategory[],
  fallback: string,
): string {
  const own = config.title?.trim();
  if (own) return own;
  if (config.source === "featured") return t.featured;
  if (config.source === "newest") return t.newArrivals;
  if (config.source === "category") {
    return findSectionCategory(categories, config.categoryId)?.category.name ?? fallback;
  }
  // A hand-picked row has no source to name itself after, so it keeps the
  // section's own built-in heading until the merchant types one.
  return fallback;
}

/**
 * Every configured product section on a page, paired with the query it needs —
 * what `shop/page.tsx` fetches in parallel and what the preview joins against.
 *
 * A section whose query is `null` is dropped here rather than fetched: asking
 * with no filter would return the whole catalogue under a heading naming a
 * collection that no longer exists.
 */
export function configuredSections(
  sections: StoreHomeSection[],
  /* The RESOLVED config, not `store.sectionConfig` — a preset's implied rows
     are configured rows and must be fetched for like any other. `resolveSections`
     returns the merged list; passing the raw stored one skips them. */
  config: StoreSectionConfig[] | undefined,
  categories: CatalogCategory[],
): { key: string; query: Record<string, string | number> }[] {
  const rows: { key: string; query: Record<string, string | number> }[] = [];
  for (const section of sections) {
    if (!isConfigurableSection(section.type)) continue;
    const own = configFor(config, section.key);
    if (!own) continue;
    const query = sectionQuery(own, categories);
    if (query) rows.push({ key: section.key, query });
  }
  return rows;
}
