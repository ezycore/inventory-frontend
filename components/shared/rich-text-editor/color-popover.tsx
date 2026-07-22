"use client";
// coding-standard: maintained
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Baseline, Highlighter } from "lucide-react";
import { cn } from "@ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/components/popover";

/**
 * Swatch popover for text colour (TipTap Color) or highlight (Highlight). All
 * swatches are hex values the renderer's `safeCssColor` accepts, so nothing here
 * can produce a value the storefront then drops.
 */
const TEXT_SWATCHES = [
  "#111827", "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#6b7280",
];
const HIGHLIGHT_SWATCHES = [
  "#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#e9d5ff",
  "#fecaca", "#fed7aa", "#a7f3d0", "#c7d2fe", "#fef08a",
];

export function ColorPopover({
  editor,
  mode,
  disabled,
  active,
}: {
  editor: Editor | null;
  mode: "text" | "highlight";
  disabled?: boolean;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isText = mode === "text";
  const swatches = isText ? TEXT_SWATCHES : HIGHLIGHT_SWATCHES;
  const label = isText ? "Text colour" : "Highlight";

  const apply = (color: string) => {
    if (!editor) return;
    if (isText) editor.chain().focus().setColor(color).run();
    else editor.chain().focus().setHighlight({ color }).run();
    setOpen(false);
  };
  const clear = () => {
    if (!editor) return;
    if (isText) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().unsetHighlight().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={label}
          title={label}
          aria-pressed={active}
          className={cn("size-8", active && "bg-accent text-accent-foreground")}
        >
          {isText ? <Baseline /> : <Highlighter />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => apply(c)}
              className="size-6 rounded border border-border"
              style={{ background: c }}
              aria-label={c}
              title={c}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="mt-2 h-7 w-full text-xs"
        >
          Remove
        </Button>
      </PopoverContent>
    </Popover>
  );
}
