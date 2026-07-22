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
import Text from "@tiptap/extension-text";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { SAFE_RICH_HREF } from "@/lib/storefront-rich-doc";
import { Callout } from "./callout-node";
import { FaqAnswer, FaqItem, FaqList, FaqQuestion } from "./faq-node";

/**
 * The editor's full schema — deliberately restricted to what the storefront
 * renderer (components/storefront/rich-doc-view.tsx) knows how to draw. Adding
 * an extension here without teaching the renderer its node/mark would make
 * content silently disappear on the shop. (TextStyle must precede Color — Color
 * applies its value as an attr on the textStyle mark.)
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
  Callout,
  FaqList,
  FaqItem,
  FaqQuestion,
  FaqAnswer,
];
