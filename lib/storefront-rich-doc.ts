// coding-standard: maintained
/**
 * Rich-text CMS page bodies: a TipTap/ProseMirror JSON document, restricted to
 * the node/mark set the admin editor exposes (see components/shared/rich-text-editor).
 * Dependency-free, like lib/storefront-markdown.ts — the renderer
 * (components/storefront/rich-doc-view.tsx) walks this typed tree into React
 * nodes directly, so owner content can never inject markup. Legacy pages whose
 * `body` is still markdown text are bridged into this shape via
 * `legacyMarkdownToRichDoc` so the editor can open them pre-formatted; once
 * saved, a page permanently moves to this JSON format (no bulk migration).
 */

import {
  parseStorefrontMarkdown,
  type SfBlock,
  type SfFaqItem,
  type SfInline,
} from "@/lib/storefront-markdown";

// Links render/apply only for schemes that can't execute script. One definition
// for the editor, its Link extension, and the renderer. Mirrors SAFE_HREF in
// lib/storefront-markdown.ts:29 (frozen legacy parser) — keep in sync.
export const SAFE_RICH_HREF = /^(https?:\/\/|mailto:|tel:|\/)/i;

/**
 * Image sources, which are a NARROWER set than link hrefs.
 *
 * `mailto:` and `tel:` are meaningless in a `src`, and `data:` is excluded on
 * purpose: it lets arbitrary bytes ride inside the document (an SVG among them),
 * turning a size-capped rich doc into an unbounded payload that no upload limit
 * ever saw. Merchant images arrive through the content-image endpoint and come
 * back as ordinary https URLs, so nothing legitimate needs the wider set.
 */
export const SAFE_RICH_IMAGE_SRC = /^(https?:\/\/|\/)/i;

export const FAQ_LIST_NODE = "faqList" as const;
export const FAQ_ITEM_NODE = "faqItem" as const;
export const FAQ_QUESTION_NODE = "faqQuestion" as const;
export const FAQ_ANSWER_NODE = "faqAnswer" as const;
export const CALLOUT_NODE = "callout" as const;
export const IMAGE_NODE = "image" as const;
export const TABLE_NODE = "table" as const;
export const TABLE_ROW_NODE = "tableRow" as const;
export const TABLE_HEADER_NODE = "tableHeader" as const;
export const TABLE_CELL_NODE = "tableCell" as const;

export type RichDocAlign = "left" | "center" | "right" | "justify";
export type RichDocCalloutVariant = "info" | "warning" | "success";

export type RichDocMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "textStyle"; attrs?: { color?: string | null } }
  | { type: "highlight"; attrs?: { color?: string | null } }
  | { type: "link"; attrs: { href: string } };

export interface RichDocTextNode {
  type: "text";
  text: string;
  marks?: RichDocMark[];
}

export interface RichDocHardBreakNode {
  type: "hardBreak";
}

export type RichDocInlineNode = RichDocTextNode | RichDocHardBreakNode;

export interface RichDocParagraphNode {
  type: "paragraph";
  attrs?: { textAlign?: RichDocAlign | null };
  content?: RichDocInlineNode[];
}

export interface RichDocHeadingNode {
  type: "heading";
  attrs: { level: 1 | 2 | 3; textAlign?: RichDocAlign | null };
  content?: RichDocInlineNode[];
}

export interface RichDocListItemNode {
  type: "listItem";
  content: RichDocParagraphNode[];
}

export interface RichDocBulletListNode {
  type: "bulletList";
  content: RichDocListItemNode[];
}

export interface RichDocOrderedListNode {
  type: "orderedList";
  content: RichDocListItemNode[];
}

export interface RichDocBlockquoteNode {
  type: "blockquote";
  content: RichDocParagraphNode[];
}

export interface RichDocHorizontalRuleNode {
  type: "horizontalRule";
}

/**
 * Widths a body image may take, as a PERCENTAGE of the content column.
 *
 * Percent rather than pixels because the same document renders in a ~600px
 * desktop column and a ~360px phone one — see `image-node.ts`. A closed list
 * rather than a free number so the renderer has something to validate against:
 * the stored tree is writable through the raw API.
 */
export const IMAGE_WIDTHS = [25, 50, 100] as const;
export type RichDocImageWidth = (typeof IMAGE_WIDTHS)[number];

export const IMAGE_ALIGNS = ["left", "center", "right"] as const;
export type RichDocImageAlign = (typeof IMAGE_ALIGNS)[number];

/** A validated image width, or the 100% default. */
export function safeImageWidth(value: unknown): RichDocImageWidth {
  return (IMAGE_WIDTHS as readonly unknown[]).includes(value)
    ? (value as RichDocImageWidth)
    : 100;
}

/** A validated image alignment, or the centred default. */
export function safeImageAlign(value: unknown): RichDocImageAlign {
  return (IMAGE_ALIGNS as readonly unknown[]).includes(value)
    ? (value as RichDocImageAlign)
    : "center";
}

/**
 * Should text flow BESIDE this image rather than below it?
 *
 * Only meaningful with a left or right alignment — a centred image has no side
 * for text to occupy — and only above the storefront's 680px breakpoint, where
 * there is room for two columns. The renderer therefore expresses it as a data
 * attribute for CSS to act on, not as an inline `float`: a phone has to drop
 * back to a full-width block, and an inline style cannot carry a media query.
 */
export function safeImageWrap(value: unknown): boolean {
  return value === true;
}

export interface RichDocImageNode {
  type: typeof IMAGE_NODE;
  attrs: {
    src: string;
    /** Percentage of the content column. See `IMAGE_WIDTHS`. */
    width?: RichDocImageWidth | null;
    align?: RichDocImageAlign | null;
    /** Let text flow beside the image. See `safeImageWrap`. */
    wrap?: boolean | null;
    /**
     * Kept even when empty. An image a merchant did not describe is decorative
     * as far as a screen reader is concerned, and `alt=""` is how you say that —
     * omitting the attribute makes the reader announce the filename instead.
     */
    alt?: string | null;
    title?: string | null;
  };
}

interface RichDocCellAttrs {
  colspan?: number;
  rowspan?: number;
  colwidth?: (number | null)[] | null;
}

export interface RichDocTableCellNode {
  type: typeof TABLE_CELL_NODE;
  attrs?: RichDocCellAttrs;
  content?: RichDocBlockNode[];
}

export interface RichDocTableHeaderNode {
  type: typeof TABLE_HEADER_NODE;
  attrs?: RichDocCellAttrs;
  content?: RichDocBlockNode[];
}

export interface RichDocTableRowNode {
  type: typeof TABLE_ROW_NODE;
  content?: (RichDocTableCellNode | RichDocTableHeaderNode)[];
}

export interface RichDocTableNode {
  type: typeof TABLE_NODE;
  content?: RichDocTableRowNode[];
}

export interface RichDocCalloutNode {
  type: typeof CALLOUT_NODE;
  attrs?: { variant?: RichDocCalloutVariant };
  content?: RichDocParagraphNode[];
}

export interface RichDocFaqQuestionNode {
  type: typeof FAQ_QUESTION_NODE;
  content?: RichDocInlineNode[];
}

export interface RichDocFaqAnswerNode {
  type: typeof FAQ_ANSWER_NODE;
  content: RichDocParagraphNode[];
}

export interface RichDocFaqItemNode {
  type: typeof FAQ_ITEM_NODE;
  content: [RichDocFaqQuestionNode, RichDocFaqAnswerNode];
}

export interface RichDocFaqListNode {
  type: typeof FAQ_LIST_NODE;
  content: RichDocFaqItemNode[];
}

export type RichDocBlockNode =
  | RichDocParagraphNode
  | RichDocHeadingNode
  | RichDocBulletListNode
  | RichDocOrderedListNode
  | RichDocBlockquoteNode
  | RichDocHorizontalRuleNode
  | RichDocImageNode
  | RichDocFaqListNode
  | RichDocTableNode
  | RichDocCalloutNode;

export interface RichDocRoot {
  type: "doc";
  content: RichDocBlockNode[];
}

/** Any node in the tree — used by the renderer for exhaustive switches. */
export type RichDocNode =
  | RichDocRoot
  | RichDocBlockNode
  | RichDocListItemNode
  | RichDocFaqItemNode
  | RichDocFaqQuestionNode
  | RichDocFaqAnswerNode
  | RichDocTableRowNode
  | RichDocTableCellNode
  | RichDocTableHeaderNode
  | RichDocInlineNode;

// --- Render-time attribute guards -------------------------------------------
// The stored JSON is untrusted (writable via the raw API, not just the editor),
// so every attribute the renderer turns into a style/attr is validated here —
// the same posture as SAFE_RICH_HREF for links.

// Hex (#rgb/#rrggbb), rgb()/rgba(), or a small named-colour set. Anything with a
// `;`, `url(`, `expression(`, etc. fails, so no CSS can be smuggled through.
const CSS_COLOR_RE =
  /^(#(?:[0-9a-f]{3}|[0-9a-f]{6})|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\))$/i;
const NAMED_COLORS = new Set([
  "black", "white", "red", "green", "blue", "yellow", "orange", "purple", "pink",
  "gray", "grey", "brown", "cyan", "magenta", "teal", "navy", "maroon", "olive",
  "lime", "aqua", "silver", "gold", "transparent",
]);

/** A CSS colour safe to place in an inline `style`, or undefined. */
export function safeCssColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (CSS_COLOR_RE.test(v)) return v;
  if (NAMED_COLORS.has(v.toLowerCase())) return v;
  return undefined;
}

const ALIGNS = new Set<string>(["left", "center", "right", "justify"]);

/** A validated text-align value, or undefined (→ inherit/left). */
export function safeAlign(value: unknown): RichDocAlign | undefined {
  return typeof value === "string" && ALIGNS.has(value)
    ? (value as RichDocAlign)
    : undefined;
}

/** A table col/row span coerced to a sane integer in [1, 100]. */
export function clampSpan(value: unknown): number {
  const n = typeof value === "number" ? Math.floor(value) : 1;
  return n >= 1 && n <= 100 ? n : 1;
}

/** A stored `body` is a rich doc when it parses as `{ type: "doc", content: [...] }`. */
export function parseRichDoc(body: string | null | undefined): RichDocRoot | null {
  if (!body) return null;
  const trimmed = body.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parsed as RichDocRoot;
    }
  } catch {
    // Not JSON — a legacy markdown body.
  }
  return null;
}

export function isRichDocBody(body: string | null | undefined): boolean {
  return parseRichDoc(body) !== null;
}

const emptyToUndef = <T,>(arr: T[]): T[] | undefined => (arr.length > 0 ? arr : undefined);

function sfInlineToRichDocInline(nodes: SfInline[]): RichDocInlineNode[] {
  const out: RichDocInlineNode[] = [];
  for (const n of nodes) {
    if (!n.text) continue;
    if (n.kind === "bold") out.push({ type: "text", text: n.text, marks: [{ type: "bold" }] });
    else if (n.kind === "italic") out.push({ type: "text", text: n.text, marks: [{ type: "italic" }] });
    else if (n.kind === "link") out.push({ type: "text", text: n.text, marks: [{ type: "link", attrs: { href: n.href } }] });
    else out.push({ type: "text", text: n.text });
  }
  return out;
}

function sfHeadingToRichDoc(block: Extract<SfBlock, { kind: "heading" }>): RichDocHeadingNode {
  return { type: "heading", attrs: { level: block.level }, content: emptyToUndef(sfInlineToRichDocInline(block.inline)) };
}

function sfParagraphToRichDoc(block: Extract<SfBlock, { kind: "paragraph" }>): RichDocParagraphNode {
  const content: RichDocInlineNode[] = [];
  block.lines.forEach((line, i) => {
    if (i > 0) content.push({ type: "hardBreak" });
    content.push(...sfInlineToRichDocInline(line));
  });
  return { type: "paragraph", content: emptyToUndef(content) };
}

function sfListToRichDoc(block: Extract<SfBlock, { kind: "list" }>): RichDocBulletListNode | RichDocOrderedListNode {
  const items: RichDocListItemNode[] = block.items.map((item) => ({
    type: "listItem",
    content: [{ type: "paragraph", content: emptyToUndef(sfInlineToRichDocInline(item)) }],
  }));
  return block.ordered ? { type: "orderedList", content: items } : { type: "bulletList", content: items };
}

function sfQuoteToRichDoc(block: Extract<SfBlock, { kind: "quote" }>): RichDocBlockquoteNode {
  return { type: "blockquote", content: [{ type: "paragraph", content: emptyToUndef(sfInlineToRichDocInline(block.inline)) }] };
}

function sfFaqItemToRichDoc(item: SfFaqItem): RichDocFaqItemNode {
  const question: RichDocFaqQuestionNode = {
    type: FAQ_QUESTION_NODE,
    content: emptyToUndef(sfInlineToRichDocInline(item.q)),
  };
  const answerParagraphs: RichDocParagraphNode[] = item.a.length
    ? item.a.map((line) => ({ type: "paragraph", content: emptyToUndef(sfInlineToRichDocInline(line)) }))
    : [{ type: "paragraph" }];
  const answer: RichDocFaqAnswerNode = { type: FAQ_ANSWER_NODE, content: answerParagraphs };
  return { type: FAQ_ITEM_NODE, content: [question, answer] };
}

function sfFaqToRichDoc(block: Extract<SfBlock, { kind: "faq" }>): RichDocFaqListNode {
  return { type: FAQ_LIST_NODE, content: block.items.map(sfFaqItemToRichDoc) };
}

/** Maps the legacy markdown block model onto the rich-doc schema (see module header). */
export function sfBlocksToTiptapDoc(blocks: SfBlock[]): RichDocRoot {
  if (blocks.length === 0) {
    // ProseMirror's `doc` node requires at least one block child.
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  const content: RichDocBlockNode[] = blocks.map((block) => {
    switch (block.kind) {
      case "heading":
        return sfHeadingToRichDoc(block);
      case "paragraph":
        return sfParagraphToRichDoc(block);
      case "list":
        return sfListToRichDoc(block);
      case "quote":
        return sfQuoteToRichDoc(block);
      case "divider":
        return { type: "horizontalRule" };
      case "faq":
        return sfFaqToRichDoc(block);
    }
  });
  return { type: "doc", content };
}

export function legacyMarkdownToRichDoc(source: string): RichDocRoot {
  return sfBlocksToTiptapDoc(parseStorefrontMarkdown(source));
}

// --- Plain-text bridges ------------------------------------------------------
// Product descriptions were a plain textarea before they became rich docs, so
// every reader has to cope with BOTH shapes forever: the stored value is a
// rich-doc JSON string for anything saved since, and bare prose for anything
// that has not been re-edited (and for every row the CSV importer creates).
// These two functions are that boundary — `richDocToPlainText` for the places
// that need text (SEO, JSON-LD, CSV export), `plainTextToRichDoc` for the
// editor opening a legacy value.

/**
 * Blocks that produce one LINE of output. Everything else is a container and
 * just recurses — the distinction matters because a `listItem` wraps a
 * `paragraph`, and counting both would put a blank line between every bullet.
 */
const LINE_BLOCKS = new Set<string>(["paragraph", "heading", FAQ_QUESTION_NODE]);

const CELL_NODES = new Set<string>([TABLE_CELL_NODE, TABLE_HEADER_NODE]);

/** Inline text of one node: text nodes concatenated, hard breaks as newlines. */
function inlineText(node: any): string {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(inlineText).join("");
}

/** Appends this node's lines. Containers recurse; `LINE_BLOCKS` emit. */
function blockLines(node: any, lines: string[]): void {
  if (!node || typeof node !== "object") return;
  if (LINE_BLOCKS.has(node.type)) {
    lines.push(inlineText(node));
    return;
  }
  // A row is one line so a size chart does not become one column per line, and
  // cells are space-joined so "S" and "38" cannot run together as "S38".
  if (node.type === TABLE_ROW_NODE) {
    const cells = (node.content ?? [])
      .filter((c: any) => CELL_NODES.has(c?.type))
      .map((c: any) => (c.content ?? []).map(inlineText).join(" ").trim());
    lines.push(cells.filter(Boolean).join(" "));
    return;
  }
  for (const child of node.content ?? []) blockLines(child, lines);
}

/**
 * The stored description/body as plain text, whatever shape it is in.
 *
 * A rich doc is flattened; a legacy plain-text value is returned as-is (trimmed).
 * That fallback is the whole point — callers get one function instead of each
 * re-implementing the "is this JSON?" branch, and a caller that forgets the
 * branch is the bug this replaces.
 *
 * Lines within a top-level block are joined with a single newline (bullets,
 * table rows); top-level blocks are separated by a blank line. Mirrors the
 * backend's `src/utils/rich-doc.ts` — keep the two in step, they are why the CSV
 * column and the meta description agree.
 */
export function richDocToPlainText(body: string | null | undefined): string {
  if (!body) return "";
  const doc = parseRichDoc(body);
  if (!doc) return body.trim();
  const parts: string[] = [];
  for (const block of doc.content ?? []) {
    const lines: string[] = [];
    blockLines(block, lines);
    const text = lines
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
    if (text) parts.push(text);
  }
  return parts.join("\n\n").trim();
}

/**
 * Bare prose → rich doc. Blank lines split paragraphs, single newlines become
 * hard breaks — which is what a merchant who typed into the old textarea meant.
 *
 * Deliberately NOT `legacyMarkdownToRichDoc`: that one reads `#`, `-` and `>` as
 * structure, and a product description saying "Size - M" is not a bullet list.
 */
export function plainTextToRichDoc(source: string): RichDocRoot {
  const text = (source ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return { type: "doc", content: [{ type: "paragraph" }] };
  const content: RichDocParagraphNode[] = text.split(/\n\s*\n/).map((para) => {
    const inline: RichDocInlineNode[] = [];
    para.split("\n").forEach((line, i) => {
      if (i > 0) inline.push({ type: "hardBreak" });
      if (line) inline.push({ type: "text", text: line });
    });
    return { type: "paragraph", content: emptyToUndef(inline) };
  });
  return { type: "doc", content };
}
