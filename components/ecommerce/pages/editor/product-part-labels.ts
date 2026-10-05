// coding-standard: maintained
import {
  ADDED_PRODUCT_PARTS,
  DEFAULT_PRODUCT_PARTS,
  type ProductPartKind,
} from "@/lib/storefront-builder/product-parts";
import type { EditorBlock } from "./section-instances";

/**
 * The product parts editor's words and the small helpers it shares with them —
 * kept apart from the component so the list logic can be tested on its own.
 */

export const PART_LABELS: Record<ProductPartKind, string> = {
  name: "Name",
  badges: "Stock badge and tags",
  price: "Price",
  summary: "Short description",
  options: "Options",
  quantity: "Quantity",
  buy: "Buy buttons",
  delivery: "Delivery estimate",
  promises: "Trust promises",
  text: "Text",
  collapsible: "Collapsible text",
};

/** What a part with no settings of its own is, said where its settings would be. */
export const PART_NOTES: Record<ProductPartKind, string> = {
  name: "The product's own name.",
  badges: "In stock or Out of stock, then the product's tags.",
  price: "The price, with the old price struck through when the product has one.",
  summary:
    "The product's description, when it is short. A long one — or one with a heading, list or table — always shows in its own block below the photos.",
  options:
    "The product's options, such as size and colour. Products without options skip it. It stays above the buy buttons, so shoppers choose before they buy.",
  quantity: "The quantity picker. It stays above the buy buttons. Hide it if shoppers nearly always buy one.",
  buy: "Add to cart, Buy now and the wishlist heart. It cannot be hidden — it is how shoppers order.",
  delivery: "How long delivery takes, from your delivery settings.",
  promises: "Your shop's promises, with their icons, in one column.",
  text: "A short note of your own.",
  collapsible: "A title shoppers tap to open — for a size chart, care, or anything that would crowd the page.",
};

export const ADD_DESCRIPTIONS: Record<(typeof ADDED_PRODUCT_PARTS)[number], string> = {
  text: "A line or two — a care note, a gift-wrap offer",
  collapsible: "A size chart, care or materials, folded away",
  promises: "Cash on delivery, returns — the promises you wrote",
};

export const REFUSED = "Options and Quantity stay above the buy buttons, so shoppers choose before they buy.";

/**
 * A single part's block id. Fixed rather than random, so a part keeps its id —
 * and its selection — when the list is written for the first time.
 */
export const singleId = (part: ProductPartKind) => `part-${part}`;

/** The parts as the editor shows them: what is stored, or the column as every product page drew it. */
export function editorParts(blocks?: readonly EditorBlock[]): EditorBlock[] {
  return blocks && blocks.length > 0
    ? [...blocks]
    : DEFAULT_PRODUCT_PARTS.map((part) => ({ id: singleId(part), settings: { part } }));
}

export const kindOf = (block: EditorBlock) => block.settings.part as ProductPartKind;

export function partLabel(block: EditorBlock): string {
  const title = block.settings.title;
  return kindOf(block) === "collapsible" && typeof title === "string" && title ? title : PART_LABELS[kindOf(block)];
}
