"use client";
// coding-standard: maintained
import { useEffect, useRef } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import { legacyMarkdownToRichDoc, parseRichDoc, type RichDocRoot } from "@/lib/storefront-rich-doc";
import { richTextExtensions } from "./extensions";

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
): Editor | null {
  const initial = useRef<RichDocRoot | null>(null);
  initial.current ??= parseRichDoc(value) ?? legacyMarkdownToRichDoc(value ?? "");

  // Ref keeps onUpdate pointed at the latest onChange without rebuilding the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: richTextExtensions,
    content: initial.current,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChangeRef.current(JSON.stringify(editor.getJSON())),
  });

  useEffect(() => {
    // emitUpdate=false: toggling editability must not fire onChange — that
    // would serialize (and so silently convert) an untouched legacy body.
    if (editor && editor.isEditable !== !disabled) editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  return editor;
}
