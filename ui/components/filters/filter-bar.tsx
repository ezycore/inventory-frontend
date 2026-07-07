"use client";

import { useFilters } from "@/hooks/use-filters";
import { FilterConfig } from "@/types/DataTable";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";
import { X } from "lucide-react";
import { useMemo, useRef } from "react";
import { FilterFieldRenderer } from "./filter-field-renderer";
import { FilterPanel } from "./filter-panel";
import { useInlineOverflow } from "./use-inline-overflow";

/** Field types that render as an inline control; the rest live in the panel only. */
const INLINE_TYPES = new Set(["select", "text", "number"]);
/** Free-text types commit on a debounce; selects commit live. */
const FREE_TEXT_TYPES = new Set(["text", "number"]);
const ITEM_WIDTH = 160;
const ITEM_GAP = 8;
/** Width kept clear for the Filters button + Reset (px). */
const RESERVED = 190;

interface FilterBarProps {
  config: FilterConfig;
  className?: string;
}

/**
 * Advanced-filter bar: inline select controls packed left, width-driven overflow
 * folded into the panel (Filters button shown only on overflow), plus an inline
 * Reset. Inline controls and the panel are two views of one shared `useFilters`
 * state — editing either updates the same source. Selects apply live on change.
 */
export function FilterBar({ config, className }: FilterBarProps) {
  const fields = config.fields ?? [];
  const state = useFilters(
    fields,
    config.onApply,
    config.applyOnChange,
    config.initialValues,
  );

  const inlineEligible = useMemo(
    () => fields.filter((f) => INLINE_TYPES.has(f.type)),
    [fields],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleCount = useInlineOverflow({
    ref: containerRef,
    itemCount: inlineEligible.length,
    itemWidth: ITEM_WIDTH,
    gap: ITEM_GAP,
    reserved: RESERVED,
  });

  const visibleInline = inlineEligible.slice(0, visibleCount);
  const hasHiddenInline = visibleCount < inlineEligible.length;
  const hasPanelOnlyFields = fields.length > inlineEligible.length;
  // Show the Filters button whenever something isn't reachable inline.
  const showPanelButton = hasHiddenInline || hasPanelOnlyFields;

  const handleReset = () => {
    state.reset();
    config.onReset?.();
  };

  if (fields.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
    >
      {visibleInline.map((field) => {
        if (field.showWhen && !field.showWhen(state.values)) return null;
        const isFreeText = FREE_TEXT_TYPES.has(field.type);
        // Free-text binds to the immediate input mirror (debounced commit);
        // selects bind to the committed value (live commit).
        const value = isFreeText
          ? state.filterInputs[field.name]
          : state.values[field.name];
        const active = value !== "" && value != null;
        return (
          <div key={field.name} className="relative w-40 shrink-0">
            <FilterFieldRenderer
              field={field}
              value={value}
              hideLabel
              // `data-[size=default]:h-8` overrides SelectTrigger's h-9 data-variant;
              // plain `h-8` sizes the text Input / NumberField to match search + button.
              controlClassName="h-8 data-[size=default]:h-8"
              onChange={(v) =>
                isFreeText
                  ? state.setFilterDebounced(field.name, v)
                  : state.setFieldAndApply(field.name, v)
              }
            />
            {/* Selects carry their own hover-clear; free-text needs an explicit ✕. */}
            {isFreeText && active && (
              <button
                type="button"
                aria-label={`Clear ${field.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  state.setFieldAndApply(field.name, field.defaultValue ?? "");
                }}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {showPanelButton && (
        <div className="shrink-0">
          <FilterPanel config={config} state={state} showReset={false} />
        </div>
      )}

      {state.activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 shrink-0 gap-1 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" /> Reset
        </Button>
      )}
    </div>
  );
}
