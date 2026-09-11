"use client";
// coding-standard: maintained
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ImageIcon,
  Trash2,
  WrapText,
} from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/components/popover";
import {
  IMAGE_ALIGNS,
  IMAGE_WIDTHS,
  type RichDocImageAlign,
} from "@/lib/storefront-rich-doc";

/**
 * Size / alignment / description / delete for the SELECTED image. Mounted by the
 * toolbar only while an image node is selected, the same way `TableControls` is
 * mounted only inside a table — contextual controls stay out of the main row.
 *
 * An image had none of this when insert first shipped: it went in at full width,
 * centred, undescribed, and the only way to remove it was to know that
 * backspace works on a selected node.
 */
const ALIGN_ICONS: Record<RichDocImageAlign, React.ReactNode> = {
  left: <AlignLeft className="size-4" />,
  center: <AlignCenter className="size-4" />,
  right: <AlignRight className="size-4" />,
};

const WIDTH_LABELS: Record<number, string> = {
  25: "Small (25%)",
  50: "Medium (50%)",
  100: "Full width",
};

export function ImageControls({ editor }: { editor: Editor | null }) {
  const [altOpen, setAltOpen] = useState(false);
  const [alt, setAlt] = useState("");

  if (!editor) return null;
  const current = editor.getAttributes("image");

  const set = (attrs: Record<string, unknown>) =>
    editor.chain().focus().updateAttributes("image", attrs).run();

  const openAlt = (next: boolean) => {
    setAltOpen(next);
    if (next) setAlt(editor.getAttributes("image").alt ?? "");
  };

  const applyAlt = () => {
    // Trimmed to "" rather than removed: an image the merchant chose not to
    // describe is decorative, and `alt=""` is how that is said to a screen
    // reader. Dropping the attribute makes it announce the filename instead.
    set({ alt: alt.trim() });
    setAltOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
            <ImageIcon className="size-3.5" /> Image <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Size</DropdownMenuLabel>
          {IMAGE_WIDTHS.map((width) => (
            <DropdownMenuItem
              key={width}
              onSelect={() => set({ width })}
              className={current.width === width ? "bg-accent" : undefined}
            >
              {WIDTH_LABELS[width]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Position</DropdownMenuLabel>
          {IMAGE_ALIGNS.map((align) => (
            <DropdownMenuItem
              key={align}
              onSelect={() => set({ align })}
              className={current.align === align ? "bg-accent" : undefined}
            >
              {ALIGN_ICONS[align]}
              <span className="capitalize">{align}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Text</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => {
              const next = !current.wrap;
              // Turning wrap ON at full width is a no-op the merchant would read
              // as broken — there is no room beside a 100% image — so drop it to
              // half. Turning wrap off leaves the width alone; they chose it.
              set(
                next && current.width === 100
                  ? { wrap: true, width: 50 }
                  : { wrap: next },
              );
            }}
            className={current.wrap ? "bg-accent" : undefined}
          >
            <WrapText className="size-4" />
            {current.wrap ? "Text wraps beside" : "Wrap text beside image"}
          </DropdownMenuItem>
          {current.wrap && current.align === "center" ? (
            <DropdownMenuLabel className="max-w-56 text-xs font-normal text-muted-foreground">
              Pick Left or Right above — a centred image has no side for text.
            </DropdownMenuLabel>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => editor.chain().focus().deleteSelection().run()}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" /> Remove image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={altOpen} onOpenChange={openAlt}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs">
            Alt text
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-2 p-3">
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyAlt();
              }
            }}
            placeholder="Describe the image for screen readers"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty if the image is decorative.
          </p>
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={applyAlt}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
