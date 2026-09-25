// coding-standard: maintained
import type {
  StorefrontFooterBlock,
  StorefrontFooterGroup,
  StorefrontFooterLink,
  StorefrontFooterStyle,
} from "@/types";
import { groupsFromBlocks } from "@/lib/storefront-footer/blocks";
import { footerLinkType, footerLinkValue, isFooterLinkComplete } from "@/lib/storefront-footer/links";
import { parseRichDoc } from "@/lib/storefront-rich-doc";

/**
 * The footer's slice of the settings PATCH and the preview message — built by
 * `draft-payloads.ts` for both, so the preview can never promise a link or a
 * block the saved store would not draw.
 */

const blank = (value?: string) => value?.trim() || undefined;

/**
 * A link as saved: typed, trimmed, and dropped when it has no label or no
 * target — the storefront used to draw such a row as a dead `#`. A legacy
 * `{ label, url }` row is rewritten in the typed shape on its first save.
 */
function cleanLink(link: StorefrontFooterLink): StorefrontFooterLink[] {
  if (!isFooterLinkComplete(link)) return [];
  const type = footerLinkType(link);
  return [
    {
      label: link.label.trim(),
      type,
      value: footerLinkValue(link),
      ...(type === "url" && link.newTab ? { newTab: true } : {}),
    },
  ];
}

export const trimFooterGroups = (groups: StorefrontFooterGroup[]): StorefrontFooterGroup[] =>
  groups
    .filter((g) => g.title.trim())
    .map((g) => ({ title: g.title.trim(), links: g.links.flatMap(cleanLink) }));

/** A rich-doc body with no text in it is no body. */
function cleanBody(body?: string): string | undefined {
  const doc = parseRichDoc(body);
  if (!doc) return undefined;
  const json = JSON.stringify(doc.content ?? []);
  return json.includes('"text"') || json.includes('"type":"image"') ? body : undefined;
}

function cleanBlock(block: StorefrontFooterBlock): StorefrontFooterBlock {
  const out: StorefrontFooterBlock = { ...block, title: blank(block.title) };
  if (block.links) out.links = block.links.flatMap(cleanLink);
  if (block.type === "text") out.body = cleanBody(block.body);
  if (block.alt !== undefined) out.alt = blank(block.alt);
  if (block.url !== undefined) out.url = blank(block.url);
  if (block.logos) {
    out.logos = block.logos
      .filter((logo) => logo.image?.url)
      .map((logo) => ({ image: logo.image, alt: logo.alt.trim(), ...(blank(logo.url) ? { url: blank(logo.url) } : {}) }));
  }
  return out;
}

export const cleanFooterBlocks = (blocks: StorefrontFooterBlock[]): StorefrontFooterBlock[] =>
  blocks.map(cleanBlock);

/** `color` only means something on the custom ground; anything else would linger unseen. */
export function cleanFooterStyle(style: StorefrontFooterStyle): StorefrontFooterStyle {
  const { color, ...rest } = style;
  return style.ground === "custom" && color ? { ...rest, color } : rest;
}

/**
 * The footer's keys on `nav`. With blocks, `footer` is DERIVED from the link
 * blocks so the legacy copy never disagrees with what the shop draws; without,
 * the groups the merchant edited are saved as before.
 */
export function footerNav(draft: {
  footerGroups: StorefrontFooterGroup[];
  footerStyle: StorefrontFooterStyle;
  footerBlocks: StorefrontFooterBlock[] | null;
}) {
  const blocks = draft.footerBlocks ? cleanFooterBlocks(draft.footerBlocks) : undefined;
  return {
    footer: trimFooterGroups(blocks ? groupsFromBlocks(blocks) : draft.footerGroups),
    footerStyle: cleanFooterStyle(draft.footerStyle),
    footerBlocks: blocks,
  };
}
