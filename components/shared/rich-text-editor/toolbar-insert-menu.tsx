"use client";
// coding-standard: maintained
import type { ChainedCommands } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { ChevronDown, Info, Minus, Plus, Table as TableIcon } from "lucide-react";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import type { RichDocCalloutVariant } from "@/lib/storefront-rich-doc";

/**
 * "Insert ▾" menu for the less-frequent block inserts (table, divider, callout,
 * Q&A) so the toolbar's main row stays scannable.
 */
const CALLOUTS: { variant: RichDocCalloutVariant; label: string }[] = [
  { variant: "info", label: "Info" },
  { variant: "warning", label: "Warning" },
  { variant: "success", label: "Success" },
];

export function InsertMenu({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const run = (build: (c: ChainedCommands) => ChainedCommands) => {
    if (editor) build(editor.chain().focus()).run();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1 px-2 text-xs"
        >
          <Plus className="size-3.5" /> Insert <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={() => run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}
        >
          <TableIcon className="size-4" /> Table
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.setHorizontalRule())}>
          <Minus className="size-4" /> Divider
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Info className="size-4 mr-2" /> Callout
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {CALLOUTS.map((c) => (
              <DropdownMenuItem
                key={c.variant}
                onSelect={() => run((chain) => chain.insertCallout(c.variant))}
              >
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run((c) => c.insertFaqBlock())}>Q&amp;A card</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
