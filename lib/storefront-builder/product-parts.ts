// coding-standard: maintained
import { PRODUCT_PARTS } from "@/lib/storefront-builder/section-specs";

/**
 * The product page's column beside the photos, as an ordered list of parts —
 * the one model the storefront draws and the page editor edits.
 *
 * Stored as `product-main`'s blocks (see the spec). This module owns what a
 * stored list MEANS: the default when there is none, which parts may appear
 * once, which cannot be hidden, and where the buying parts may sit.
 */

export type ProductPartKind = (typeof PRODUCT_PARTS)[number];

/** What one part stores — a `product-main` block's settings. */
export interface ProductPartSettings {
  part: ProductPartKind;
  hidden?: boolean;
  /** A collapsible part's title. */
  title?: string;
  /** A text or collapsible part's words, as a rich-text document. */
  text?: string;
  /** Whether a collapsible part starts open. */
  open?: boolean;
}

/** A part ready to draw: its settings plus a key stable across reorders. */
export interface ProductPart extends ProductPartSettings {
  key: string;
}

/**
 * The column as every product page drew it before the parts could move, in
 * that order — and what a page with no parts saved still draws.
 */
export const DEFAULT_PRODUCT_PARTS: readonly ProductPartKind[] = [
  "name",
  "badges",
  "price",
  "summary",
  "options",
  "quantity",
  "buy",
  "delivery",
];

/** The parts the merchant adds, in the order the add menu offers them. */
export const ADDED_PRODUCT_PARTS = ["text", "collapsible", "promises"] as const;

/** Parts a page holds at most once. Text and collapsible repeat. */
export const isSinglePart = (part: ProductPartKind): boolean => part !== "text" && part !== "collapsible";

/**
 * The ways to order: never hidden, never missing. A page that showed a product
 * with no way to buy it is not a layout choice anyone makes on purpose.
 */
export const isLockedPart = (part: ProductPartKind): boolean => part === "options" || part === "buy";

/**
 * Parts that must come before the buy buttons. The page always preselects an
 * option, so options below the button let a shopper buy one they never saw; a
 * quantity below it is picked after the press that used it.
 */
export const isAboveBuyPart = (part: ProductPartKind): boolean => part === "options" || part === "quantity";

/** Whether `parts` keeps every part that must sit above the buy buttons there. */
export function buyingOrderHolds(parts: readonly { part: ProductPartKind }[]): boolean {
  const buy = parts.findIndex(({ part }) => part === "buy");
  return buy < 0 || parts.every(({ part }, index) => !isAboveBuyPart(part) || index < buy);
}

/**
 * The parts to draw, in order, from what the section stored.
 *
 * - **Nothing stored** is the default column, exactly.
 * - A hidden part is left out, unless it is locked.
 * - A single part stored twice draws once, at its first place: two buy panels
 *   would be two sets of options fighting over one selection.
 * - A list missing the buy buttons gets them at the end, and one missing the
 *   options gets them just above the buttons — hand-written data must not be
 *   able to make a product unbuyable.
 */
export function productParts(blocks?: readonly { id: string; settings: ProductPartSettings }[]): ProductPart[] {
  if (!blocks || blocks.length === 0) return DEFAULT_PRODUCT_PARTS.map((part) => ({ key: part, part }));
  const seen = new Set<ProductPartKind>();
  const parts: ProductPart[] = [];
  for (const { id, settings } of blocks) {
    const { part } = settings;
    if (isSinglePart(part)) {
      if (seen.has(part)) continue;
      seen.add(part);
    }
    if (settings.hidden && !isLockedPart(part)) continue;
    parts.push({ ...settings, key: id });
  }
  if (!seen.has("buy")) parts.push({ key: "buy", part: "buy" });
  if (!seen.has("options")) {
    const buy = parts.findIndex(({ part }) => part === "buy");
    parts.splice(buy, 0, { key: "options", part: "options" });
  }
  return parts;
}
