// coding-standard: maintained
import type {
  FooterBlockType,
  FooterBlockWidth,
  StorefrontFooterBlock,
  StorefrontFooterContentPages,
  StorefrontFooterGroup,
  StorefrontFooterStyle,
} from "./types";

/**
 * A composed footer's blocks: their defaults, and the bridge from the five
 * fixed layouts.
 *
 * **The layouts stay.** A store that has never composed a footer has no
 * `footerBlocks` and keeps rendering its `templates.footer` layout exactly as it
 * did. `blocksFromLayout` is what the editor SHOWS for such a store — the
 * layout, spelt as blocks — and the first block edit saves that list, which is
 * the moment the store moves onto the block renderer. Picking a layout again
 * clears the list and puts the store back on the fixed layout.
 */

/** Desktop track per block type when the merchant has not chosen one. */
export const DEFAULT_BLOCK_WIDTH: Record<FooterBlockType, FooterBlockWidth> = {
  brand: "wide",
  links: "auto",
  pages: "auto",
  contact: "narrow",
  newsletter: "narrow",
  promises: "full",
  text: "wide",
  image: "auto",
  logos: "wide",
  social: "auto",
};

/** Link-shaped blocks are accordions on a phone and read the phone setting. */
export const LINK_BLOCK_TYPES: readonly FooterBlockType[] = ["links", "pages"];

export const blockWidth = (block: StorefrontFooterBlock): FooterBlockWidth =>
  block.width ?? DEFAULT_BLOCK_WIDTH[block.type];

/** Types that may appear once — a second brand or sign-up form is never wanted. */
export const SINGLE_USE_BLOCKS: readonly FooterBlockType[] = [
  "brand",
  "pages",
  "contact",
  "newsletter",
  "promises",
];

let seq = 0;
/** A block id unique within one footer. Never shown; only keys the list. */
export function newBlockId(type: FooterBlockType): string {
  seq = (seq + 1) % 1_000_000;
  return `${type}-${Date.now().toString(36)}${seq.toString(36)}`;
}

export function newBlock(type: FooterBlockType): StorefrontFooterBlock {
  const block: StorefrontFooterBlock = { id: newBlockId(type), type };
  if (type === "links") return { ...block, title: "Links", links: [] };
  if (type === "logos") return { ...block, logos: [] };
  return block;
}

export type FooterLayout = "columns" | "simple" | "rich" | "contact" | "newsletter";

interface LegacyFooter {
  layout: FooterLayout;
  groups: StorefrontFooterGroup[];
  contentPages?: StorefrontFooterContentPages;
}

/**
 * A fixed layout as blocks — the same pieces in the same order. Ids are stable
 * (`<type>-<n>`) so the editor's list does not remount while the merchant is
 * still looking at an untouched layout.
 */
export function blocksFromLayout({ layout, groups, contentPages }: LegacyFooter): StorefrontFooterBlock[] {
  const links: StorefrontFooterBlock[] = groups.map((group, i) => ({
    id: `links-${i}`,
    type: "links",
    title: group.title,
    links: group.links,
  }));
  const pages: StorefrontFooterBlock[] =
    contentPages?.show === false ? [] : [{ id: "pages-0", type: "pages", title: contentPages?.title }];
  const brand = (extra: Partial<StorefrontFooterBlock> = {}): StorefrontFooterBlock => ({
    id: "brand-0",
    type: "brand",
    ...extra,
  });

  switch (layout) {
    case "rich":
      return [{ id: "promises-0", type: "promises" }, brand(), ...links, ...pages];
    case "contact":
      return [brand({ showPhone: false }), { id: "contact-0", type: "contact" }, ...links, ...pages];
    case "newsletter":
      return [brand({ showPhone: false }), { id: "newsletter-0", type: "newsletter" }, ...links, ...pages];
    case "simple":
      return [brand({ width: "full" }), ...links, ...pages];
    default:
      return [brand(), ...links, ...pages];
  }
}

/** The frame a layout implies when it becomes blocks — only `simple` has one. */
export function styleForLayout(layout: FooterLayout): Partial<StorefrontFooterStyle> {
  return layout === "simple" ? { align: "center" } : {};
}

/** The link groups a block list carries, for the legacy `nav.footer` copy. */
export function groupsFromBlocks(blocks: StorefrontFooterBlock[]): StorefrontFooterGroup[] {
  return blocks
    .filter((block) => block.type === "links")
    .map((block) => ({ title: block.title ?? "", links: block.links ?? [] }));
}
