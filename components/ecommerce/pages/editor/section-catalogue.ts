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
  heading: "Heading",
  height: "Picture height (px)",
  hideText: "Hide text",
  hideTextOnMobile: "Hide text on phones",
  icon: "Icon",
  image: "Picture",
  imageFit: "Picture fit",
  imageRatio: "Picture shape",
  imageSide: "Picture side",
  layout: "Layout",
  limit: "Number of products",
  link: "Link",
  mobileColumns: "Columns on phones",
  mobileImage: "Phone picture",
  mode: "Style",
  perRow: "Cards per row",
  productIds: "Products",
  question: "Question",
  radius: "Corner roundness",
  ratio: "Picture shape",
  secondaryHref: "Second button link",
  secondaryLabel: "Second button label",
  shape: "Card shape",
  showLabels: "Show names",
  side: "Picture side",
  source: "Products to show",
  split: "Picture share (%)",
  style: "Style",
  subtitle: "Subtitle",
  tagIds: "Tags",
  text: "Text",
  title: "Title",
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
};

/**
 * Settings whose options ARE a Customize choice, named the way Customize names
 * them — so "Extra tall" or "Full photo" reads the same on both screens, and a
 * rename there is a rename here.
 */
const CUSTOMIZE_OPTIONS: Record<string, string> = {
  cardImageFit: "imageFit",
  cardImageRatio: "imageRatio",
};

/** Readable names for enum values, where the raw value would not read well. */
const VALUE_LABELS: Record<string, string> = {
  "full-bleed": "Full width",
  "4:5": "Portrait 4:5",
  "1:1": "Square",
  "4:3": "Landscape 4:3",
  "16:9": "Wide 16:9",
  "3:4": "Portrait 3:4",
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
  return customize?.label ?? VALUE_LABELS[value] ?? sentence(words(value));
};

export const sectionLabel = (type: string): string =>
  Object.hasOwn(SECTION_CATALOGUE, type) ? SECTION_CATALOGUE[type as SectionType].label : sentence(words(type));
