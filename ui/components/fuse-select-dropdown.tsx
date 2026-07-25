"use client";
// coding-standard: maintained

import type { SelectOption } from "@/ui/components/form/type";
import { PopoverContent } from "@ui/components/popover";
import { cn } from "@ui/lib/utils";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Listbox popover for `FuseAdvancedSelect`. Purely presentational: the combobox
 * input owns focus, the query and the highlighted row — this only paints them.
 * Carries no search box of its own (the field itself is the search box).
 */

interface FuseSelectDropdownProps {
  /** Shared with the input's `aria-controls` / `aria-activedescendant`. */
  listId: string;
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
  options,
  selectedValues,
  activeIndex,
  onActivate,
  onSelect,
  query,
}: FuseSelectDropdownProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const wheelCleanup = useRef<(() => void) | null>(null);

  // Keep the keyboard highlight visible as ↑/↓ walks past the fold.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // This listbox is portaled to <body>, so when it opens inside a Sheet/Dialog
  // (the product form is a drawer) react-remove-scroll's scroll lock swallows
  // wheel events over it — the scrollbar thumb still drags, but the wheel does
  // nothing. Drive the scroll ourselves from a *non-passive* wheel listener so
  // preventDefault actually takes (React's onWheel is passive), the same trick
  // Radix Select's viewport uses. Attached via a callback ref because the node
  // mounts only when the popover opens.
  const attachList = useCallback((node: HTMLDivElement | null) => {
    wheelCleanup.current?.();
    wheelCleanup.current = null;
    listRef.current = node;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      if (node.scrollHeight <= node.clientHeight) return; // nothing to scroll
      const step =
        e.deltaMode === 1
          ? e.deltaY * 16 // lines → px
          : e.deltaMode === 2
            ? e.deltaY * node.clientHeight // pages → px
            : e.deltaY;
      node.scrollTop += step;
      e.preventDefault();
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    wheelCleanup.current = () => node.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <PopoverContent
      className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[12rem]"
      align="start"
      sideOffset={4}
      // The popover is a listbox, not a focus trap: focus must stay in the input
      // or typing stops dead. Radix moves it on both edges unless told not to.
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <div
        id={listId}
        ref={attachList}
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
