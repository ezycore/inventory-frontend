"use client";
// coding-standard: maintained
import type { ChainedCommands } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { ChevronDown, Table as TableIcon } from "lucide-react";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";

/**
 * Row/column controls, shown only when the cursor is inside a table (the
 * toolbar mounts this conditionally). Uses TipTap's table commands.
 */
export function TableControls({ editor }: { editor: Editor | null }) {
  const run = (build: (c: ChainedCommands) => ChainedCommands) => {
    if (editor) build(editor.chain().focus()).run();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
          <TableIcon className="size-3.5" /> Table <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => run((c) => c.addColumnBefore())}>Add column before</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.addColumnAfter())}>Add column after</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.deleteColumn())}>Delete column</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run((c) => c.addRowBefore())}>Add row before</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.addRowAfter())}>Add row after</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.deleteRow())}>Delete row</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run((c) => c.toggleHeaderRow())}>Toggle header row</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => run((c) => c.deleteTable())}
          className="text-destructive focus:text-destructive"
        >
          Delete table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
