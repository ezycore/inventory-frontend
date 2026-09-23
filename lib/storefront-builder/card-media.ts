// coding-standard: maintained
import type { StoreTemplates } from "@/lib/storefront-client";
import { mediaFitFor, mediaRatioFor } from "@/lib/storefront-templates";

/** A product section's own card photo settings — both optional (`CARD_PHOTO` in the section specs). */
export interface CardPhotoSettings {
  cardImageFit?: StoreTemplates["imageFit"];
  cardImageRatio?: StoreTemplates["imageRatio"];
}

/** A card photo's frame and fit as the renderer uses them. */
export interface CardMedia {
  imageFit?: "cover" | "canvas";
  imageRatio?: string;
}

/**
 * The card photo frame and fit a product section asks for — only what the
 * section itself sets. An unset value is left out, so the card keeps following
 * the store's Customize → Product cards choice (and its live draft in the
 * Customize preview); a set one wins for this section's cards alone.
 */
export function sectionCardMedia(settings: CardPhotoSettings): CardMedia {
  return {
    ...(settings.cardImageFit ? { imageFit: mediaFitFor(settings.cardImageFit) } : {}),
    ...(settings.cardImageRatio ? { imageRatio: mediaRatioFor(settings.cardImageRatio) } : {}),
  };
}

/** A product section's own card chrome — both optional (`CARD_LOOK` in the section specs). */
export interface CardLookSettings {
  cardCorners?: "sharp" | "soft" | "round";
  cardButtons?: "solid" | "outline" | "soft";
}

/**
 * The card chrome a product section asks for, as the data attributes
 * `storefront.css` styles from — `data-card-corners` and `data-card-buttons`.
 *
 * **Attributes, not inline custom properties, and that is the point.** The
 * values those attributes select (4/12/18px, and the three button fills) are
 * already written once in `storefront.css` for the store-wide controls; the
 * section's rules are the same declarations with a second selector. Emitting
 * `--btn-bg: var(--primary-soft)` from here instead would be a second copy of
 * the design in TypeScript, free to drift from the one a merchant sees when
 * they set it store-wide.
 *
 * An unset setting emits no attribute at all, so the cards keep inheriting the
 * shop's own tokens — including a store-wide choice the merchant made in Look.
 */
export function sectionCardLook(settings: CardLookSettings): Record<string, string> {
  return {
    ...(settings.cardCorners ? { "data-card-corners": settings.cardCorners } : {}),
    ...(settings.cardButtons ? { "data-card-buttons": settings.cardButtons } : {}),
  };
}
