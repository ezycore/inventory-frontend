"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useSelectOptions } from "@/services/api";
import { Button } from "@/ui/components/button";
import { DragHandle, DropLine } from "@/ui/components/drag-handle";
import { FuseAdvancedSelect } from "@/ui/components/fuse-advanced-select";
import { useDragReorder } from "@/ui/hooks/use-drag-reorder";
import { cn } from "@/ui/lib/utils";

/** Puts the item at `from` at `to`, splice semantics — what `useDragReorder` reports. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * A hand-picked, ordered list of products — a Manual product section's
 * `productIds` (docs/plan/storefront-product-order.md §8). The storefront shows
 * them in exactly this order.
 *
 * The combobox only ADDS: a pick goes to the end of the list. The list below is
 * the selection, in order, and is where a product is moved (drag the handle, or
 * arrow keys on it) or removed. A multi-select's chips would show the same
 * products a second time, out of order and capped at three.
 *
 * Names come from the same cached option list the combobox searches, so drawing
 * the rows costs no extra request. Thumbnails are left out on purpose: that list
 * is every product in the catalogue, and images would make it megabytes.
 */
export function ProductListField({
  id,
  optionsApi,
  value,
  onChange,
  max,
}: {
  id: string;
  optionsApi: string;
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}) {
  const { data: options } = useSelectOptions(optionsApi);
  const names = useMemo(
    () => new Map((options ?? []).map((option) => [String(option.value), String(option.label)])),
    [options],
  );
  const nameOf = (productId: string) => names.get(productId) ?? "Product no longer available";
  const [announcement, setAnnouncement] = useState("");

  const { listRef, drag, handleProps } = useDragReorder((from, to) => {
    onChange(moveItem(value, from, to));
    setAnnouncement(`${nameOf(value[from])} moved to position ${to + 1} of ${value.length}.`);
  });

  const full = max !== undefined && value.length >= max;
  const add = (picked: unknown) => {
    if (typeof picked !== "string" || !picked || value.includes(picked) || full) return;
    onChange([...value, picked]);
    setAnnouncement(`${nameOf(picked)} added at position ${value.length + 1}.`);
  };
  const remove = (productId: string) => {
    onChange(value.filter((item) => item !== productId));
    setAnnouncement(`${nameOf(productId)} removed.`);
  };

  return (
    <div className="space-y-2">
      <FuseAdvancedSelect
        id={id}
        optionsApi={optionsApi}
        mode="single"
        // Always empty: this box adds to the list below rather than holding a value.
        value={undefined}
        placeholder={full ? `All ${max} places are filled` : "Add a product…"}
        disabled={full}
        onValueChange={add}
      />

      {value.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">
            Shown in this order. Drag to change it{max !== undefined ? ` · ${value.length} of ${max}` : ""}.
          </p>
          <ol ref={listRef} className="space-y-1" aria-label="Chosen products, in order">
            {value.map((productId, index) => {
              const dragging = drag?.from === index;
              const moving = drag !== null && drag.to !== drag.from;
              const missing = !names.has(productId) && options !== undefined;
              return (
                <li
                  key={productId}
                  data-drag-row
                  className={cn("relative", dragging && "z-10")}
                  style={dragging ? { transform: `translateY(${drag.offset}px)` } : undefined}
                >
                  {moving && drag.to < drag.from && index === drag.to ? <DropLine edge="top" /> : null}
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-md border bg-card py-1 pl-0.5 pr-1",
                      dragging && "border-primary shadow-lg",
                    )}
                  >
                    <DragHandle
                      label={nameOf(productId)}
                      dragging={dragging}
                      {...handleProps(index, value.length)}
                    />
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        missing && "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {nameOf(productId)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${nameOf(productId)}`}
                      title="Remove"
                      onClick={() => remove(productId)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {moving && drag.to > drag.from && index === drag.to ? <DropLine edge="bottom" /> : null}
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
