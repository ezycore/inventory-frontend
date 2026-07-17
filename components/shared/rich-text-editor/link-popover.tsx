"use client";
// coding-standard: maintained
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link2 } from "lucide-react";
import { cn } from "@ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/components/popover";
import { SAFE_RICH_HREF } from "@/lib/storefront-rich-doc";

/**
 * Toolbar link control: set/update/remove the link on the current selection.
 * Hrefs are gated by SAFE_RICH_HREF at entry for fast feedback (the storefront
 * renderer re-validates independently). A bare domain gets https:// prepended.
 */
export function LinkPopover({
  editor,
  active,
  disabled,
}: {
  editor: Editor | null;
  active?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    setError(false);
    if (next && editor) setUrl(editor.getAttributes("link").href ?? "");
  };

  const apply = () => {
    if (!editor) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }
    const href = SAFE_RICH_HREF.test(trimmed)
      ? trimmed
      : /^[\w-]+(\.[\w-]+)+/.test(trimmed)
        ? `https://${trimmed}`
        : null;
    if (!href) {
      setError(true);
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Link"
          title="Link"
          aria-pressed={active}
          className={cn("size-8", active && "bg-accent text-accent-foreground")}
        >
          <Link2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2 p-3">
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="https://example.com or /shop/products"
          aria-invalid={error}
        />
        {error ? (
          <p className="text-xs text-destructive">Use a http(s), mailto:, tel: or /-relative URL.</p>
        ) : null}
        <div className="flex justify-end gap-2">
          {active ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                setOpen(false);
              }}
            >
              Remove
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
