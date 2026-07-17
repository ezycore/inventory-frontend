"use client";
// coding-standard: maintained
import { EditorContent } from "@tiptap/react";
import { cn } from "@ui/lib/utils";
import { RichTextToolbar } from "./toolbar";
import { useRichTextContent } from "./use-rich-text-content";
import "./rich-text-editor.css";

/**
 * Structured rich-text editor for storefront CMS page bodies. Emits the
 * document as TipTap JSON (a string, via onChange) — never HTML; the
 * storefront renders it with components/storefront/rich-doc-view.tsx. Opens
 * legacy markdown bodies pre-formatted via the lib/storefront-rich-doc bridge.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (json: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const editor = useRichTextContent(value, onChange, disabled);
  return (
    <div
      className={cn(
        "rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} className="rte-content px-3 py-2" />
    </div>
  );
}
