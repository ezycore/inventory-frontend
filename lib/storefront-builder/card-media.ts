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
