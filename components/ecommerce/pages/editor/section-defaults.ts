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
  // Never added by hand (`addable: false`): a page's move fills both settings in.
  "content-body": { settings: { title: "", body: "" } },
  // Unset layout = "whatever the store's template says", which is what a cart
  // page drew before it moved.
  "cart-lines": { settings: {} },
  "checkout-form": { settings: {} },
  "account-area": { settings: {} },
  "search-results": { settings: {} },
  "collection-grid": { settings: {} },
  "product-main": { settings: {} },
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
  // Reviews cannot be invented: the first starts without a name, so the section
  // stays unfinished until the merchant enters a real one.
  testimonials: { settings: { heading: "What customers say" }, blocks: [{ name: "" }] },
  benefits: {
    settings: { heading: "Why you'll love it" },
    blocks: [{ icon: "check", title: "A benefit", text: "Say what it does for the shopper." }],
  },
  "how-to-order": {
    settings: { heading: "How to order" },
    blocks: [
      { title: "Choose your product" },
      { title: "Fill in the order form" },
      { title: "Get it at your door" },
    ],
  },
  // The link cannot be guessed: it starts incomplete.
  video: { settings: { label: "Watch the video" } },
  spacer: { settings: { space: { base: 40 } } },
  countdown: { settings: { endsAt: "" } },
};

/** A new repeatable item's settings, by section type. */
export const BLOCK_DEFAULTS: Partial<Record<SectionType, Record<string, unknown>>> = {
  hero: { title: "New slide" },
  faq: { question: "New question", answer: "Write your answer here." },
  "promises-band": { text: "New promise" },
  // A card needs a collection, which cannot be guessed: it starts incomplete.
  "category-promo-cards": {},
  // A review needs a real customer's name.
  testimonials: { name: "" },
  benefits: { title: "New benefit" },
  "how-to-order": { title: "New step" },
};
