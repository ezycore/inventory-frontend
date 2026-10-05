"use client";
// coding-standard: maintained

import type { KeyboardEvent, PointerEvent } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/ui/lib/utils";

/**
 * The handle a row is dragged by in the editor's reorderable lists — the page's
 * sections and the product page's parts. Takes `useDragReorder`'s `handleProps`.
 * A real button, so a keyboard reaches it and moves the row with the arrow keys.
 */
export function DragHandle({
  label,
  dragging,
  ...handle
}: {
  /** Names the row: "Move Price: drag, or press the up and down arrow keys". */
  label: string;
  dragging: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  style: { touchAction: "none" };
}) {
  return (
    <button
      type="button"
      {...handle}
      aria-label={`Move ${label}: drag, or press the up and down arrow keys`}
      title="Drag to move"
      className={cn(
        "flex h-7 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}

/** Where a dragged row would land: a line on the edge of the row it would sit beside. */
export function DropLine({ edge }: { edge: "top" | "bottom" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-primary",
        edge === "top" ? "-top-[3px]" : "-bottom-[3px]",
      )}
    />
  );
}
