// coding-standard: maintained
/**
 * Per-section config (`StoreSectionConfig`) turned into something renderable:
 * the promo-card shapes, sizes and layouts, and the category lookup the
 * builder's sections share. Product-row queries live in `lib/storefront-builder`.
 */

import type {
  CatalogCategory,
  StoreSectionCard,
  StoreSectionConfig,
} from "@/lib/storefront-client";

/** How a `category-banners` card arranges its photograph against its copy. */
export type SectionCardShape = "stacked" | "split";

/**
 * The promo card's composition, with the unset case decided in ONE place.
 *
 * Only an explicit `split` moves the picture beside the copy. Anything else —
 * unset, null, a value from an older payload — is a shop that has never been
 * asked, and it draws the stacked card every row drew before the choice
 * existed: flipping the fallback would restyle every existing homepage without
 * its owner touching anything.
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
