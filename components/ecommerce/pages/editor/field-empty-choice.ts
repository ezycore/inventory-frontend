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
 * - `inherit` — a merchant-configurable source. Keep the choice, name the source.
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
/** A picture with no shape is drawn whole, at its own proportions. */
const WHOLE_PICTURE: FieldEmptyChoice = { kind: "meaning", label: "Whole picture" };

/**
 * By `"<section type>.<field>"`, falling back to `"<field>"` for the settings
 * shared by several sections (`CARD_PHOTO`, `storeHeading`).
 */
const EMPTY_CHOICES: Record<string, FieldEmptyChoice> = {
  // Inherited — the merchant can open the named panel and change it.
  cardImageRatio: FOLLOW_PRODUCT_CARDS,
  cardImageFit: FOLLOW_PRODUCT_CARDS,
  "hero.imageFit": FOLLOW_PRODUCT_CARDS, // useStoreImageFit(), services/storefront/use-image-fit.ts
  "single-product.galleryLayout": { kind: "inherit", label: "Follow Product page" },

  // Empty is its own answer, and no listed value says it.
  storeHeading: { kind: "meaning", label: "My own heading" },
  "image-banner.frame": WHOLE_PICTURE,
  "gallery.frame": WHOLE_PICTURE,
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
