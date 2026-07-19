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

export const FAQ_LIST_NODE = "faqList" as const;
export const FAQ_ITEM_NODE = "faqItem" as const;
export const FAQ_QUESTION_NODE = "faqQuestion" as const;
export const FAQ_ANSWER_NODE = "faqAnswer" as const;
export const CALLOUT_NODE = "callout" as const;
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
