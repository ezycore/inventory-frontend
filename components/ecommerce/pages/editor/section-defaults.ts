// coding-standard: maintained
import type { SectionType } from "@/lib/storefront-builder/section-specs";

/**
 * What a section holds the moment it is added: enough to save and to draw, so
 * the merchant sees it appear in the preview and edits real content instead of
 * filling a form first.
 *
 * The one exception is **Image and text**, whose picture is required and cannot
 * be invented — it starts incomplete, is kept out of saves, and says so until a
 * picture is chosen (`isComplete` in `section-instances.ts`).
 *
 * `blocks` are settings only; ids are given when the section is created.
 */
export interface SectionDefault {
  settings: Record<string, unknown>;
  blocks?: Record<string, unknown>[];
}

/** A one-paragraph rich-text document, as the editor stores it (TipTap JSON). */
const paragraph = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

export const SECTION_DEFAULTS: Record<SectionType, SectionDefault> = {
  hero: {
    settings: { layout: "card" },
    blocks: [{ title: "Your headline", subtitle: "One line about the offer.", buttonLabel: "Shop now", link: "/products" }],
  },
  "rich-text": { settings: { body: paragraph("Write something here.") } },
  faq: {
    settings: { heading: "Questions" },
    blocks: [{ question: "Do you deliver everywhere?", answer: "Write your answer here." }],
  },
  "call-to-action": {
    settings: { heading: "Your headline", buttonLabel: "Shop now", buttonHref: "/products" },
  },
  "product-grid": { settings: { heading: "New arrivals", source: "newest", limit: 8 } },
  "promises-band": {
    settings: {},
    blocks: [
      { text: "Cash on delivery", icon: "truck" },
      { text: "Easy returns", icon: "shield" },
      { text: "Genuine products", icon: "check" },
    ],
  },
  "image-text": { settings: { heading: "Your headline" } },
  "shop-by-tag": { settings: { heading: "Shop by tag", tagIds: [] } },
  "collections-row": { settings: { heading: "Collections" } },
  "selected-products": { settings: { source: "newest", limit: 4 } },
  "product-carousel": { settings: { heading: "Popular", source: "newest", limit: 8 } },
  "campaign-offers": { settings: {} },
  "category-tiles": { settings: {} },
  "category-promo-cards": { settings: {} },
  // The product cannot be guessed: like Image and text, these start incomplete.
  "order-form": { settings: { heading: "Order now" } },
  "single-product": { settings: {} },
  "offer-pricing": { settings: { heading: "Special offer" } },
  "sticky-order-bar": { settings: {} },
  countdown: { settings: { endsAt: "" } },
};

/** A new repeatable item's settings, by section type. */
export const BLOCK_DEFAULTS: Partial<Record<SectionType, Record<string, unknown>>> = {
  hero: { title: "New slide" },
  faq: { question: "New question", answer: "Write your answer here." },
  "promises-band": { text: "New promise" },
  // A card needs a collection, which cannot be guessed: it starts incomplete.
  "category-promo-cards": {},
};
