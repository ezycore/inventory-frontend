// coding-standard: maintained
import type { Extensions } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { SAFE_RICH_HREF } from "@/lib/storefront-rich-doc";
import { FaqAnswer, FaqItem, FaqList, FaqQuestion } from "./faq-node";

/**
 * The editor's full schema — deliberately restricted to what the storefront
 * renderer (components/storefront/rich-doc-view.tsx) knows how to draw. Adding
 * an extension here without teaching the renderer its node/mark would make
 * content silently disappear on the shop.
 */
export const richTextExtensions: Extensions = [
  Document,
  Text,
  Paragraph,
  Heading.configure({ levels: [1, 2, 3] }),
  Bold,
  Italic,
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  HorizontalRule,
  HardBreak,
  Link.configure({
    openOnClick: false,
    autolink: true,
    // Editor-side gate for fast feedback; the storefront renderer re-validates
    // every href independently (the stored JSON is writable via the raw API).
    isAllowedUri: (url) => SAFE_RICH_HREF.test(url),
  }),
  FaqList,
  FaqItem,
  FaqQuestion,
  FaqAnswer,
];
