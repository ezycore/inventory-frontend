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
  /* A system page's core section overriding the store's own `templates.*`
     (plan §6). The panels that used to own these left Customize on the same
     day, so they name the stored value, not a screen — see `STORE_DEFAULT`. */
  "single-product.galleryLayout": STORE_DEFAULT,
  "product-main.layout": STORE_DEFAULT,
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
  "gallery.frame": WHOLE_PICTURE,
  /* It followed nothing. No hero calls `useStoreImageFit()` — the carousel says
     so in as many words, having been changed away from it deliberately — and
     every hero branch falls back to showing the whole picture, so the control
     named a source it did not have and hid the answer it did. */
  "hero.imageFit": WHOLE_PICTURE,
  // A stacked card runs 16:9 and a split card 4:3 — see resolveCardRatio.
  "category-promo-cards.ratio": { kind: "meaning", label: "The card decides" },

  // Built-in fallbacks: the control shows the value the section already draws.
  "hero.align": { kind: "value", value: "left" },
  "call-to-action.align": { kind: "value", value: "left" }, // text-align: inherit → the page's left
  "image-banner.align": { kind: "value", value: "left" },
  "image-text.imageSide": { kind: "value", value: "left" },
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
};

/** What empty means for one setting, or `undefined` while it is unclassified. */
export function fieldEmptyChoice(sectionType: string | undefined, key: string): FieldEmptyChoice | undefined {
  return (sectionType ? EMPTY_CHOICES[`${sectionType}.${key}`] : undefined) ?? EMPTY_CHOICES[key];
}
