"use client";
// coding-standard: maintained

import type { SelectOption } from "@/ui/components/form/type";
import { PopoverContent } from "@ui/components/popover";
import { useInsideScrollLock } from "@ui/lib/scroll-lock";
import { cn } from "@ui/lib/utils";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Listbox popover for `FuseAdvancedSelect`. Purely presentational: the combobox
 * input owns focus, the query and the highlighted row — this only paints them.
 * Carries no search box of its own (the field itself is the search box).
 */

interface FuseSelectDropdownProps {
  /** Shared with the input's `aria-controls` / `aria-activedescendant`. */
  listId: string;
  /** The combobox field — Radix's anchor, which must never dismiss this layer. */
  anchorRef: RefObject<HTMLDivElement | null>;
  options: SelectOption[];
  selectedValues: string[];
  activeIndex: number;
  onActivate: (index: number) => void;
  onSelect: (value: string) => void;
  /** Current query — only used to word the empty state. */
  query: string;
}

export function FuseSelectDropdown({
  listId,
  anchorRef,
  options,
  selectedValues,
  activeIndex,
  onActivate,
  onSelect,
  query,
}: FuseSelectDropdownProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const insideScrollLock = useInsideScrollLock();

  // The field is the Popover's *anchor*, and Radix counts an anchor as outside
  // the layer — so the same interaction that opens the popover also dismisses
  // it. The `focusin` case is the vicious one: opening during that dispatch
  // mounts the layer, whose document listener is added below `document` and so
  // still receives the very event that opened it. Veto both, and the field
  // stays the one thing that decides whether the list is up.
  const keepOpenOnAnchor = useCallback(
    (event: Event) => {
      if (event.target instanceof Node && anchorRef.current?.contains(event.target))
        event.preventDefault();
    },
    [anchorRef]
  );

  // Keep the keyboard highlight visible as ↑/↓ walks past the fold.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <PopoverContent
      // Inside a Sheet or Dialog (the product form is a drawer) the overlay's
      // scroll lock cancels every wheel and touchmove event over a portalled
      // listbox, so the list stays in the overlay's own subtree. Until
      // 2026-09-22 this was worked around with a hand-rolled non-passive wheel
      // listener that drove `scrollTop` itself — which gave back the wheel but
      // not a finger, since the lock cancels `touchmove` the same way and there
      // was no counterpart for it. Staying inside the lock fixes both natively,
      // with the momentum a hand-driven scroll cannot reproduce.
      portal={!insideScrollLock}
      className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[12rem]"
      align="start"
      sideOffset={4}
      // The popover is a listbox, not a focus trap: focus must stay in the input
      // or typing stops dead. Radix moves it on both edges unless told not to.
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={keepOpenOnAnchor}
    >
      <div
        id={listId}
        ref={listRef}
        role="listbox"
        className="max-h-60 overflow-y-auto overflow-x-hidden py-1"
        // Blanket guard so dragging the scrollbar or hitting padding can't blur
        // the input — a blur closes the popover mid-interaction.
        onMouseDown={(e) => e.preventDefault()}
      >
        {options.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {query ? `No results for "${query}"` : "No data available"}
          </div>
        ) : (
          options.map((option, index) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                id={`${listId}-opt-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onMouseEnter={() => !option.disabled && onActivate(index)}
                // mousedown, not click: click fires after blur, by which point
                // the popover has closed and the row no longer exists.
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  if (!option.disabled) onSelect(option.value);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm outline-none",
                  index === activeIndex && "bg-accent text-accent-foreground",
                  isSelected && "font-medium",
                  option.disabled && "pointer-events-none opacity-50"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="line-clamp-1 text-left">{option.label}</span>
              </div>
            );
          })
        )}
      </div>
    </PopoverContent>
  );
}

export default FuseSelectDropdown;
