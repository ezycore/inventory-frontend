// coding-standard: maintained
import type { Extensions } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import { Color } from "@tiptap/extension-color";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  CharacterCount,
  Dropcursor,
  Gapcursor,
  TrailingNode,
  UndoRedo,
} from "@tiptap/extensions";
import Text from "@tiptap/extension-text";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { SAFE_RICH_HREF, SAFE_RICH_IMAGE_SRC } from "@/lib/storefront-rich-doc";
import { Callout } from "./callout-node";
import { ConfiguredImage } from "./image-node";
import { FaqAnswer, FaqItem, FaqList, FaqQuestion } from "./faq-node";

/**
 * The editor's full schema — deliberately restricted to what the storefront
 * renderer (components/storefront/rich-doc-view.tsx) knows how to draw. Adding
 * an extension here without teaching the renderer its node/mark would make
 * content silently disappear on the shop. (TextStyle must precede Color — Color
 * applies its value as an attr on the textStyle mark.)
 *
 * `UndoRedo`, `Gapcursor`, `TrailingNode`, `Dropcursor` and `CharacterCount`
 * are the exception
 * to that rule and the reason it is worth stating: they contribute **no nodes
 * and no marks**, only history state, cursor decorations and a counter, so there
 * is nothing for the renderer to learn and nothing that can reach stored
 * content.
 */
export const richTextExtensions: Extensions = [
  Document,
  Text,
  Paragraph,
  Heading.configure({ levels: [1, 2, 3] }),
  Bold,
  Italic,
  Underline,
  Strike,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  HorizontalRule,
  HardBreak,
  TextAlign.configure({ types: ["paragraph", "heading"] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Link.configure({
    openOnClick: false,
    autolink: true,
    // Editor-side gate for fast feedback; the storefront renderer re-validates
    // every href independently (the stored JSON is writable via the raw API).
    isAllowedUri: (url) => SAFE_RICH_HREF.test(url),
  }),
  /**
   * Undo/redo. ProseMirror has **no built-in history** — without this, Cmd+Z
   * did nothing at all (the browser's native undo cannot reach a contenteditable
   * ProseMirror manages). That was survivable while this editor was only on
   * Storefront Pages; it is a data-loss path now that it is the product
   * description field on the form every merchant uses for every product.
   */
  UndoRedo,
  /**
   * A place to put the caret when a block leaves nowhere to type — after a
   * trailing table or horizontal rule, or between two of them. Without it the
   * caret cannot be positioned there at all and the document looks finished
   * when it is not. Both offenders (`Table`, `HorizontalRule`) are in the
   * schema above.
   */
  Gapcursor,
  /**
   * Keeps an empty paragraph at the END of the document.
   *
   * Gapcursor alone is not enough: it lets you *place* a caret after a trailing
   * table, but only if you know to arrow into it or click the exact strip below
   * it. A merchant who finishes a size chart and wants a line of care
   * instructions under it just finds nowhere to type — reported as "there is no
   * way to write below the table". The trailing paragraph is that place, always
   * there, no gesture to discover.
   *
   * Contributes no node type of its own: the paragraph it inserts is the same
   * `paragraph` the renderer already draws, and an unused empty one serializes
   * to a block with no content that renders as nothing.
   */
  TrailingNode,
  /** The drop-position line while dragging content, so a drag is aimable. */
  Dropcursor,
  /**
   * Feeds the editor footer's word/character readout. No `limit` on purpose —
   * a hard stop would be measured in VISIBLE characters while the field's real
   * cap is on the serialized JSON, so it would cut a merchant off at a number
   * that does not match the one being enforced. See `editor-footer.tsx`.
   */
  CharacterCount,
  /**
   * Images in a page body. Unlike the four extensions above this one DOES add a
   * node, so `rich-doc-view.tsx` has a matching `case IMAGE_NODE` and
   * `rich-doc-parity.test.tsx` fails if it ever loses it.
   *
   * Carries `width` + `align` attributes — see `image-node.ts`. `inline: false`
   * makes it a block image. `allowBase64: false` is the load-bearing
   * setting: with it on, pasting an image from the clipboard inlines the whole
   * file as a `data:` URI inside the document, which turns a size-capped rich
   * doc into an unbounded payload that no upload limit ever inspected. Merchant
   * images go through the content-image endpoint and come back as https URLs.
   * The renderer re-validates every `src` against `SAFE_RICH_IMAGE_SRC` anyway —
   * stored JSON is writable through the raw API, not just this editor.
   */
  ConfiguredImage,
  Callout,
  FaqList,
  FaqItem,
  FaqQuestion,
  FaqAnswer,
];
