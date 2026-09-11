"use client";
// coding-standard: maintained
import { useEffect, useRef } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import {
  legacyMarkdownToRichDoc,
  parseRichDoc,
  plainTextToRichDoc,
  type RichDocRoot,
} from "@/lib/storefront-rich-doc";
import { richTextExtensions } from "./extensions";
import { inlinePastedEmojiImages } from "./paste-emoji";

/**
 * Editor lifecycle for RichTextEditor. Initial content is derived ONCE on
 * mount: a rich-doc JSON body loads as-is, a legacy markdown body is bridged
 * through legacyMarkdownToRichDoc so old pages open pre-formatted. After that
 * the editor owns the document — `value` only mirrors its serialized output,
 * so it must not be re-applied on later renders. onUpdate fires only on real
 * user edits (never during the bridge), which is what makes migration lazy: an
 * untouched legacy body stays stored as markdown until actually edited.
 */
export function useRichTextContent(
  value: string,
  onChange: (json: string) => void,
  disabled?: boolean,
  legacyFormat: "markdown" | "plaintext" = "markdown",
): Editor | null {
  const initial = useRef<RichDocRoot | null>(null);
  // Which bridge opens a non-rich value is per-field, not global: a CMS page
  // body really was markdown, a product description was a POS textarea where
  // `#` and `-` are literal. Running the markdown parser over the latter turns
  // "Size - M" into a bullet list the merchant never wrote.
  const toRichDoc =
    legacyFormat === "plaintext" ? plainTextToRichDoc : legacyMarkdownToRichDoc;
  initial.current ??= parseRichDoc(value) ?? toRichDoc(value ?? "");

  // Ref keeps onUpdate pointed at the latest onChange without rebuilding the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: richTextExtensions,
    content: initial.current,
    editable: !disabled,
    immediatelyRender: false,
    // Emoji copied out of Facebook/Slack/X are `<img>` sprites, which our
    // `image` node would otherwise adopt as full-width body images. See
    // `paste-emoji.ts`.
    editorProps: { transformPastedHTML: inlinePastedEmojiImages },
    onUpdate: ({ editor }) => onChangeRef.current(JSON.stringify(editor.getJSON())),
  });

  useEffect(() => {
    // emitUpdate=false: toggling editability must not fire onChange — that
    // would serialize (and so silently convert) an untouched legacy body.
    if (editor && editor.isEditable !== !disabled) editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  return editor;
}
