// coding-standard: maintained

import { useCallback, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * Keyboard navigation for a combobox (a text input that owns a listbox popover).
 *
 * Owns the highlighted row and translates key presses into open/close/select.
 * Deliberately knows nothing about markup — the caller renders the list and
 * paints `activeIndex`; scrolling that row into view is the list's job.
 */

interface ComboboxItem {
  value: string;
  disabled?: boolean;
}

interface UseComboboxKeyboardParams<T extends ComboboxItem> {
  open: boolean;
  /** Open the popover (callers reset their query here). */
  onOpen: () => void;
  /** Close the popover (callers restore the committed label here). */
  onClose: () => void;
  /** The currently visible (already filtered) options, in render order. */
  items: T[];
  onSelect: (value: string) => void;
  /**
   * Backspace with an empty query. Multi-select uses it to drop the last badge;
   * omit it and Backspace behaves like a normal text input.
   */
  onBackspaceEmpty?: () => void;
  isQueryEmpty: boolean;
}

interface UseComboboxKeyboardResult {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

function firstEnabled<T extends ComboboxItem>(items: T[]): number {
  const index = items.findIndex((item) => !item.disabled);
  return index === -1 ? 0 : index;
}

export function useComboboxKeyboard<T extends ComboboxItem>({
  open,
  onOpen,
  onClose,
  items,
  onSelect,
  onBackspaceEmpty,
  isQueryEmpty,
}: UseComboboxKeyboardParams<T>): UseComboboxKeyboardResult {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastItems, setLastItems] = useState(items);
  const [lastOpen, setLastOpen] = useState(open);

  // Re-point the highlight whenever the list changes or the popover reopens, so
  // Enter always targets the first (best-scoring) match rather than a stale row.
  // Adjusted during render rather than in an effect — an effect would paint the
  // stale row for a frame and trips `react-hooks/set-state-in-effect`.
  if (items !== lastItems || open !== lastOpen) {
    setLastItems(items);
    setLastOpen(open);
    setActiveIndex(firstEnabled(items));
  }

  // Walk to the next enabled row, wrapping at both ends. Bails after one full
  // lap so an all-disabled list can't spin.
  const step = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (items.length === 0) return 0;
        let next = current;
        for (let hop = 0; hop < items.length; hop++) {
          next += direction;
          if (next < 0) next = items.length - 1;
          if (next > items.length - 1) next = 0;
          if (!items[next]?.disabled) return next;
        }
        return current;
      });
    },
    [items]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp": {
          e.preventDefault();
          if (!open) {
            onOpen();
            return;
          }
          step(e.key === "ArrowDown" ? 1 : -1);
          return;
        }
        case "Home":
        case "End": {
          if (!open) return;
          e.preventDefault();
          setActiveIndex(
            e.key === "Home"
              ? firstEnabled(items)
              : items.length - 1 - firstEnabled([...items].reverse())
          );
          return;
        }
        case "Enter": {
          // Closed: let the keypress reach the form so Enter still submits.
          if (!open) return;
          // Open: always swallow it, even with nothing to pick — an open
          // dropdown must never submit the form behind it.
          e.preventDefault();
          const item = items[activeIndex];
          if (item && !item.disabled) onSelect(item.value);
          return;
        }
        case "Escape": {
          if (!open) return;
          e.preventDefault();
          onClose();
          return;
        }
        case "Tab": {
          if (open) onClose();
          return;
        }
        case "Backspace": {
          if (isQueryEmpty) onBackspaceEmpty?.();
          return;
        }
        default:
      }
    },
    [open, onOpen, onClose, step, items, activeIndex, onSelect, isQueryEmpty, onBackspaceEmpty]
  );

  return { activeIndex, setActiveIndex, onKeyDown };
}
