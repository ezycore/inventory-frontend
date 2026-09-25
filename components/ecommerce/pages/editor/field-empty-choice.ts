// coding-standard: maintained

/**
 * What a section setting means when it is empty — and therefore what its control
 * should say instead of "Default".
 *
 * Every optional enum used to gain a choice labelled "Default"
 * (`field-control.tsx`), whatever empty actually meant for that field. Three
 * different things wore the one word: a value inherited from a Customize setting
 * the merchant can go and change, a behaviour no listed value can express ("show
 * the whole picture"), and a plain built-in fallback that is simply one of the
 * listed values. The first two are worth a choice; the third is a phantom state
 * that answers neither question a control has to answer — *what am I using* and
 * *where does it come from* — and it is the one that let an edit made on the
 * phone tab reach the desktop unannounced.
 *
 * So each optional enum declares which it is:
 * - `inherit` — the value comes from somewhere else. Keep the choice and name
 *   that source: the Customize panel that owns it where one still does
 *   ("Follow Product cards"), or the store's stored value where the panel has
 *   gone ("Store default").
 * - `meaning` — empty is its own answer. Keep the choice, name the answer.
 * - `value` — empty renders as this listed value. Drop the choice; the control
 *   shows the value, which is what the shopper already sees.
 *
 * A field with no entry keeps the old generic "Default", so an enum added later
 * still works — it just has not been classified yet.
 *
 * **Keep a `value` entry equal to what the renderer falls back to.** The pairs
 * are cited beside each entry; they are the same "unset is a real answer" rule
 * `resolveCardShape` documents in `lib/storefront-sections.ts`.
 */
export type FieldEmptyChoice =
  | { kind: "inherit"; label: string }
  | { kind: "meaning"; label: string }
  | { kind: "value"; value: string };

/** Customize → Product cards owns the photo frame and fit for the whole store. */
const FOLLOW_PRODUCT_CARDS: FieldEmptyChoice = { kind: "inherit", label: "Follow Product cards" };
/**
 * The store-wide `templates.*` value this page's layout falls back to.
 *
 * It has no panel any more: Customize became the Site editor on 2026-09-20 and
 * the per-page rows went with it, so the stored value is frozen at whatever the
 * store last used and THIS control is the only way to change what the page
 * draws. Named "Store default" rather than "Follow <panel>" for exactly that
 * reason — a choice that names a screen the merchant cannot open is a worse
 * answer to "where does it come from?" than no name at all.
 */
const STORE_DEFAULT: FieldEmptyChoice = { kind: "inherit", label: "Store default" };
/** A picture with no shape is drawn whole, at its own proportions. */
const WHOLE_PICTURE: FieldEmptyChoice = { kind: "meaning", label: "Whole picture" };

/**
 * By `"<section type>.<field>"`, falling back to `"<field>"` for the settings
 * shared by several sections (`CARD_PHOTO`, `storeHeading`).
 */
const EMPTY_CHOICES: Record<string, FieldEmptyChoice> = {
  // Inherited from a Customize panel the merchant can still open and change.
  cardImageRatio: FOLLOW_PRODUCT_CARDS,
  cardImageFit: FOLLOW_PRODUCT_CARDS,
  /* A DIFFERENT panel from the two above, and the choice has to say which:
     the photo's shape and fit are Product cards, while the corners and the
     button fill are `theme.design` — the Look part's Corner radius and
     Buttons. One label naming the wrong screen is worse than none. */
  cardCorners: { kind: "inherit", label: "Follow Corner radius" },
  cardButtons: { kind: "inherit", label: "Follow Buttons" },
  /* A system page's core section overriding the store's own `templates.*`
     (plan §6). The panels that used to own these left Customize on the same
     day, so they name the stored value, not a screen — see `STORE_DEFAULT`. */
  "single-product.galleryLayout": STORE_DEFAULT,
  "product-main.layout": STORE_DEFAULT,
  /* NOT `STORE_DEFAULT` beside the layout above, though all three are this
     section's: the photo's shape and fit still have a Customize panel a
     merchant can open and change — Product cards, the same one the card
     settings name — so they name it, and the layout, whose panel left with the
     per-page rows, names the stored value instead. */
  "product-main.imageRatio": FOLLOW_PRODUCT_CARDS,
  "product-main.imageFit": FOLLOW_PRODUCT_CARDS,
  "collection-grid.layout": STORE_DEFAULT,
  "collection-grid.pagination": STORE_DEFAULT,
  "account-area.layout": STORE_DEFAULT,
  /* The exception among the core-section layouts: its store-wide value keeps a
     Customize panel, because `ContentFrame` also wraps the order-tracking page,
     which has no builder page of its own. So it names the panel, like the
     product-card settings do. */
  "content-body.layout": { kind: "inherit", label: "Follow Content & tracking" },

  // Empty is its own answer, and no listed value says it.
  storeHeading: { kind: "meaning", label: "My own heading" },
  "image-banner.frame": WHOLE_PICTURE,
  /* NOT `WHOLE_PICTURE`, which is what an unset `frame` means on `image-banner`
     and `gallery`. A hero always has a box; unset means each layout keeps the
     one it has always drawn, and on a card that is two different ratios at two
     breakpoints — which no listed value says. */
  "hero.frame": { kind: "meaning", label: "The layout decides" },
  /* Same answer, a different question: unset means "picture" on a card, whose
     media carries `order: -1`, and "text" on an open hero, whose copy is simply
     its first child. Two values, so neither can be named — `value` would have to
     lie about one of the two layouts. */
  "hero.mobileFirst": { kind: "meaning", label: "The layout decides" },
  "gallery.frame": WHOLE_PICTURE,
  // A stacked card runs 16:9 and a split card 4:3 — see resolveCardRatio.
  "category-promo-cards.ratio": { kind: "meaning", label: "The card decides" },
  /* `PromiseRows` cycles truck, shield and tag BY POSITION, so which glyph an
     unset promise draws depends on where the row sits — no listed value says
     that, and it is not the same answer as "no icon" (`NO_ICON`). */
  "promises-band.icon": { kind: "meaning", label: "The band decides" },

  // Built-in fallbacks: the control shows the value the section already draws.
  "hero.align": { kind: "value", value: "left" },
  /* Corrected 2026-09-21, and it was `WHOLE_PICTURE` before that.
     "It follows nothing" was right — no hero calls `useStoreImageFit()` — but
     `meaning` was the wrong conclusion. `fit` IS a listed value and it renders
     exactly what unset renders: `heroSlidePhoto` maps both to `canvas`. So the
     control offered "Whole picture" and "Show the whole picture" as separate
     choices that draw the same hero, which is the third question a control must
     never raise — *are these two the same?* — on top of the two at the top of
     this file. Browser QA found it; unit tests could not, because the
     "only offers values the field actually lists" check below reads `value`
     entries and says nothing about a `meaning` that duplicates one. */
  "hero.imageFit": { kind: "value", value: "fit" },
  // The phone has drawn the headline alone since long before the control existed.
  "hero.mobileCopy": { kind: "value", value: "title-only" },
  // The row under the hero is what every rotating hero has always drawn.
  "hero.dots": { kind: "value", value: "under" },
  // Dots and no arrows, since the dark carousel's went with it (decision D4).
  "hero.nav": { kind: "value", value: "dots" },
  "call-to-action.align": { kind: "value", value: "left" }, // text-align: inherit → the page's left
  "image-banner.align": { kind: "value", value: "left" },
  "image-text.imageSide": { kind: "value", value: "left" },
  /* The hero draws its picture on the RIGHT, where `image-text` draws it left —
     same field name, two different renderers, and this file's rule is that a
     `value` entry equals what its own renderer falls back to. */
  "hero.imageSide": { kind: "value", value: "right" },
  "image-text.imageRatio": { kind: "value", value: "4:5" },
  "collections-row.style": { kind: "value", value: "card" },
  "collections-row.layout": { kind: "value", value: "strip" },
  "collections-row.align": { kind: "value", value: "left" },
  "category-tiles.mode": { kind: "value", value: "tile" },
  "category-tiles.layout": { kind: "value", value: "grid" },
  "category-tiles.align": { kind: "value", value: "left" },
  "category-promo-cards.shape": { kind: "value", value: "stacked" }, // resolveCardShape
  "category-promo-cards.side": { kind: "value", value: "left" }, // resolveCardSide
  "category-promo-cards.flow": { kind: "value", value: "wrap" }, // resolveBannerLayout
  "video.ratio": { kind: "value", value: "16:9" },
  /* `benefit.icon ?? "check"` — benefits.tsx. Unlike the promises band, a
     benefit card's fallback is one fixed listed glyph, so the control shows it. */
  "benefits.icon": { kind: "value", value: "check" },
};

/** What empty means for one setting, or `undefined` while it is unclassified. */
export function fieldEmptyChoice(sectionType: string | undefined, key: string): FieldEmptyChoice | undefined {
  return (sectionType ? EMPTY_CHOICES[`${sectionType}.${key}`] : undefined) ?? EMPTY_CHOICES[key];
}

/**
 * Optional BOOLEANS whose renderer treats unset as ON.
 *
 * The switch drew `checked={value === true}`, so an unset setting whose section
 * draws it as true showed the control OFF while the shop showed it on — and the
 * merchant's first click then changed nothing they could see, because it wrote
 * the `true` that was already in force. Browser QA caught it on Show names: the
 * toggle sat off over a row of named tiles, and it took two clicks to hide one
 * name.
 *
 * Same rule as a `value` entry above, in the one shape a switch has: the control
 * shows what the section already draws. A boolean with no entry stays off when
 * unset, which is every other optional boolean in the catalogue.
 */
const BOOLEAN_DEFAULTS: Record<string, boolean> = {
  // `settings.showLabels ?? true` — category-tiles.tsx, collections-row.tsx.
  "category-tiles.showLabels": true,
  "collections-row.showLabels": true,
  // `CategoryStrip`'s own `arrows = true` default, which unset falls through to.
  "category-tiles.arrows": true,
  "collections-row.arrows": true,
};

/** Does this boolean setting draw as ON while it is unset? */
export function fieldDefaultsOn(sectionType: string | undefined, key: string): boolean {
  return (sectionType ? BOOLEAN_DEFAULTS[`${sectionType}.${key}`] : undefined) ?? BOOLEAN_DEFAULTS[key] ?? false;
}
