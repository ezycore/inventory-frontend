// coding-standard: maintained
import type { Dict } from "@/lib/storefront-i18n";

/**
 * The storefront's own wording a builder section may show where the merchant
 * typed nothing — the words the classic home page names its rows and buttons
 * with, in the shopper's language (owner decision, plan §17 Phase 5 step 5).
 *
 * A cached server view cannot know that language, so a word is drawn by the
 * `store-word` island, which reads it from the storefront dictionary. The
 * section specs spell the same ids out as enum values — they are plain data and
 * cannot import this list.
 */
export const STORE_WORDS = [
  "featured",
  "newArrivals",
  "selected",
  "viewAll",
  "shopNow",
  "browseCats",
  "startShopping",
  "shopByAge",
  "campaignOffers",
  "campaignOff",
  "editorialTitle",
  "editorialSubtitle",
] as const satisfies readonly (keyof Dict)[];

export type StoreWord = (typeof STORE_WORDS)[number];
