// coding-standard: maintained
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";

/**
 * What the page editor calls things: section names, their groups in the add
 * library (plan §8), and the label of every setting.
 *
 * English only for now — an owner decision (plan §17, Phase 3), like the rest of
 * the Online Store admin. The keys are the section specs' own
 * (`lib/storefront-builder/section-specs.ts`); a setting with no entry here still
 * gets a readable label from its key, so a new spec field never shows blank.
 */

export const SECTION_GROUPS = [
  "Hero & banners",
  "Products",
  "Categories",
  "Offers",
  "Social proof",
  "Content",
  "Conversion",
] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export interface SectionEntry {
  label: string;
  group: SectionGroup;
  description: string;
  /** The name of one repeatable item, for sections that have them. */
  item?: string;
  /** False for a type the storefront cannot draw yet — it is never offered. */
  addable: boolean;
}

export const SECTION_CATALOGUE: Record<SectionType, SectionEntry> = {
  hero: {
    label: "Hero",
    group: "Hero & banners",
    description: "A large picture with a headline and a button. Add slides to rotate several.",
    item: "Slide",
    addable: true,
  },
  "rich-text": {
    label: "Rich text",
    group: "Content",
    description: "Formatted text — headings, lists, links and pictures.",
    addable: true,
  },
  "content-body": {
    label: "Page body",
    group: "Content",
    description: "This page's text in your store's page frame. Created when a page moves here from Content.",
    // Never offered in the library: it is the content page's own core section.
    addable: false,
  },
  "cart-lines": {
    label: "Cart",
    group: "Content",
    description: "The cart itself. Created when your cart page moves onto the builder.",
    // The cart page's core section: never in the library, never twice on a page.
    addable: false,
  },
  "checkout-form": {
    label: "Checkout",
    group: "Content",
    description: "The checkout itself. Created when your checkout page moves onto the builder.",
    addable: false,
  },
  "account-area": {
    label: "Account area",
    group: "Content",
    description: "Sign-in and a shopper's orders. Created when your account page moves onto the builder.",
    addable: false,
  },
  "search-results": {
    label: "Search results",
    group: "Content",
    description: "What a shopper's search finds. Created when your search page moves onto the builder.",
    addable: false,
  },
  "collection-grid": {
    label: "Products",
    group: "Content",
    description: "A collection's products. Created when your collection page moves onto the builder.",
    addable: false,
  },
  "product-main": {
    label: "Product",
    group: "Content",
    description: "A product's photos, options and buy buttons. Created when your product page moves onto the builder.",
    addable: false,
  },
  faq: {
    label: "FAQ",
    group: "Content",
    description: "Questions and answers that open when tapped.",
    item: "Question",
    addable: true,
  },
  "call-to-action": {
    label: "Call to action",
    group: "Conversion",
    description: "A headline, a short line and one button.",
    addable: true,
  },
  "product-grid": {
    label: "Product grid",
    group: "Products",
    description: "Products in rows — newest, featured, from a collection, a tag, or picked by hand.",
    addable: true,
  },
  "promises-band": {
    label: "Promises band",
    group: "Content",
    description: "A row of short promises, like cash on delivery or easy returns.",
    item: "Promise",
    addable: true,
  },
  "image-text": {
    label: "Image and text",
    group: "Content",
    description: "A picture beside a headline, a paragraph and up to two buttons.",
    addable: true,
  },
  "shop-by-tag": {
    label: "Shop by tag",
    group: "Categories",
    description: "Chips that link to products with a tag.",
    addable: true,
  },
  "collections-row": {
    label: "Collections row",
    group: "Categories",
    description: "Your collections as cards or plain links.",
    addable: true,
  },
  "selected-products": {
    label: "Selected products",
    group: "Products",
    description: "A few products side by side, with a link to see more.",
    addable: true,
  },
  "product-carousel": {
    label: "Product carousel",
    group: "Products",
    description: "Products in one row that scrolls sideways.",
    addable: true,
  },
  "campaign-offers": {
    label: "Campaign offers",
    group: "Offers",
    description: "Your running campaigns and when they end.",
    addable: true,
  },
  "category-tiles": {
    label: "Category tiles",
    group: "Categories",
    description: "Collection pictures as tiles, circles or overlays.",
    addable: true,
  },
  "category-promo-cards": {
    label: "Category promo cards",
    group: "Categories",
    description: "Large cards promoting up to four collections.",
    item: "Card",
    addable: true,
  },
  "order-form": {
    label: "Order form",
    group: "Conversion",
    description: "One product with its options and your checkout form — shoppers order without leaving the page.",
    addable: true,
  },
  "single-product": {
    label: "Single product",
    group: "Products",
    description: "One product with its photos, options, price and buy buttons, like its product page.",
    addable: true,
  },
  "offer-pricing": {
    label: "Offer & pricing",
    group: "Offers",
    description: "A product's price with its original price crossed out and the discount.",
    addable: true,
  },
  "sticky-order-bar": {
    label: "Sticky order bar",
    group: "Conversion",
    description:
      "A bar pinned to the bottom of phone screens. Its button goes to the order form on the page, or to the product page when there is none.",
    addable: true,
  },
  testimonials: {
    label: "Testimonials",
    group: "Social proof",
    description: "What real customers said — their words, stars, photo or a screenshot of the review.",
    item: "Review",
    addable: true,
  },
  benefits: {
    label: "Benefits",
    group: "Content",
    description: "Cards with an icon, a title and a line about what the product does.",
    item: "Benefit",
    addable: true,
  },
  "how-to-order": {
    label: "How to order",
    group: "Content",
    description: "Numbered steps that show shoppers how ordering works.",
    item: "Step",
    addable: true,
  },
  video: {
    label: "Video",
    group: "Content",
    description: "A YouTube or Facebook video that starts when tapped.",
    addable: true,
  },
  countdown: {
    label: "Countdown",
    group: "Offers",
    description: "A timer to the end of an offer.",
    // Not drawn yet: its units have no Bangla terms in the glossary (plan §17).
    addable: false,
  },
};

/** Setting labels, by setting key. Shared across sections — the same key means the same thing. */
const FIELD_LABELS: Record<string, string> = {
  align: "Alignment",
  answer: "Answer",
  arrows: "Show arrows",
  badge: "Badge",
  body: "Text",
  buttonHref: "Button link",
  buttonLabel: "Button label",
  campaignBadge: "Show the running offer as the badge",
  cardImageFit: "Card photo fit",
  cardImageRatio: "Card photo shape",
  categoryId: "Collection",
  categoryIds: "Collections",
  columns: "Columns",
  coupon: "Coupon box",
  ctaHref: "Link",
  ctaLabel: "Link label",
  description: "Description",
  flow: "Layout",
  focal: "Focus point",
  galleryLayout: "Photo layout",
  heading: "Heading",
  height: "Picture height (px)",
  hideDescription: "Hide the description",
  hideText: "Hide text",
  hideTextOnMobile: "Hide text on phones",
  icon: "Icon",
  image: "Picture",
  imageFit: "Picture fit",
  imageRatio: "Picture shape",
  imageSide: "Picture side",
  label: "Video name",
  layout: "Layout",
  limit: "Number of products",
  link: "Link",
  mobileColumns: "Columns on phones",
  mobileImage: "Phone picture",
  mode: "Style",
  name: "Name",
  perRow: "Cards per row",
  photo: "Photo",
  poster: "Cover picture",
  productId: "Product",
  productIds: "Products",
  promises: "Show your promises",
  question: "Question",
  radius: "Corner roundness",
  rating: "Stars (1–5)",
  ratio: "Picture shape",
  secondaryHref: "Second button link",
  secondaryLabel: "Second button label",
  secondaryLink: "Second button link",
  shape: "Card shape",
  showLabels: "Show names",
  side: "Picture side",
  slideshow: "Show as a slideshow",
  source: "Products to show",
  split: "Picture share (%)",
  storeBanner: "Use the store banner",
  storeHeading: "Heading when empty",
  storePromises: "Use your store's promises",
  storeWords: "Use the store's wording",
  style: "Style",
  subtitle: "Subtitle",
  tagIds: "Tags",
  text: "Text",
  title: "Title",
  url: "Video link",
  viewAll: "Show a “View all” link",
  wholeRows: "Only full rows",
};

const CARD_PHOTO_HINT = "Default follows Customize → Product cards, for every card on the store.";

const HINTS: Record<string, string> = {
  buttonHref: "A page on your store like /products, a full web address, or tel: / mailto:.",
  link: "A page on your store like /products, a full web address, or tel: / mailto:.",
  ctaHref: "A page on your store like /products, or a full web address.",
  categoryIds: "Leave empty to show every collection.",
  mobileImage: "Optional. Shown on phones instead of the main picture.",
  cardImageFit: CARD_PHOTO_HINT,
  cardImageRatio: CARD_PHOTO_HINT,
  coupon: "Lets shoppers type a coupon code into the form. Off by default.",
  galleryLayout: "Default follows Customize → Product page.",
  label: "Read aloud by screen readers for the play button.",
  photo: "Optional. Only with the customer's permission.",
  poster: "Optional. A YouTube video uses its own cover when this is empty.",
  rating: "Leave empty for no stars.",
  url: "A YouTube or Facebook video link. Any other link shows nothing.",
  storeHeading: "Shown in the shopper's language when Heading is empty.",
  secondaryLink: "A page on your store like /products, a full web address, or tel: / mailto:.",
  slideshow: "Rotates the slides with dots, even when there is only one.",
  storeBanner: "Shows the banner from Customize → Hero when the first slide has no picture.",
  storeWords: "Uses your store's name and the storefront's own button words, in the shopper's language, where yours are empty.",
  storePromises: "Shows the promises from Customize → Footer instead of the rows below, and stays in step with them.",
  campaignBadge: "Names your running campaign when the first slide has no badge.",
  promises: "Lists your promises from Customize → Footer under the hero card.",
  viewAll: "Goes to Link, or else to this row's collection or all products.",
  wholeRows: "Hides the few products a short last row would leave on their own.",
};

/** Option names that only make sense for one setting, where the same value means something else elsewhere. */
const FIELD_VALUE_LABELS: Record<string, Record<string, string>> = {
  storeHeading: {
    featured: "“Featured products”",
    newArrivals: "“New arrivals”",
    selected: "“Selected for you”",
    collection: "The collection's name",
    shopByAge: "“Shop by age”",
    campaignOffers: "“Current offers”",
  },
};

/**
 * Settings whose options ARE a Customize choice, named the way Customize names
 * them — so "Extra tall" or "Full photo" reads the same on both screens, and a
 * rename there is a rename here.
 */
const CUSTOMIZE_OPTIONS: Record<string, string> = {
  cardImageFit: "imageFit",
  cardImageRatio: "imageRatio",
  galleryLayout: "product",
};

/** Readable names for enum values, where the raw value would not read well. */
const VALUE_LABELS: Record<string, string> = {
  "full-bleed": "Full width",
  "4:5": "Portrait 4:5",
  "1:1": "Square",
  "4:3": "Landscape 4:3",
  "16:9": "Wide 16:9",
  "3:4": "Portrait 3:4",
  "9:16": "Tall 9:16",
  crop: "Fill and crop",
  fit: "Show the whole picture",
  manual: "Picked by hand",
  category: "From a collection",
  tag: "With a tag",
  featured: "Featured",
  newest: "Newest",
  disc: "Circle with ring",
  alternate: "Alternate",
  mapPin: "Map pin",
};

const words = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const fieldLabel = (key: string): string => FIELD_LABELS[key] ?? sentence(words(key));

export const fieldHint = (key: string): string | undefined => HINTS[key];

/** An option's label — Customize's own wording for a setting that mirrors a Customize choice. */
export const valueLabel = (value: string, field?: string): string => {
  const source = field ? CUSTOMIZE_OPTIONS[field] : undefined;
  const customize = source ? TEMPLATE_OPTIONS[source]?.find((option) => option.value === value) : undefined;
  const own = field ? FIELD_VALUE_LABELS[field]?.[value] : undefined;
  return customize?.label ?? own ?? VALUE_LABELS[value] ?? sentence(words(value));
};

export const sectionLabel = (type: string): string =>
  Object.hasOwn(SECTION_CATALOGUE, type) ? SECTION_CATALOGUE[type as SectionType].label : sentence(words(type));

/**
 * Is this the page's **core section** — the one that draws the page itself?
 *
 * The same answer as "not offered in the add library": a section a merchant
 * cannot add is one the page's own move created, which is exactly the set that
 * must not be removed, hidden or duplicated either (§6). One source, so a new
 * core section cannot be registered as un-addable and still be deletable.
 */
export const isCoreSection = (type: string): boolean =>
  SECTION_CATALOGUE[type as SectionType]?.addable === false;
