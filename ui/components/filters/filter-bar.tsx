"use client";

import { useFilters } from "@/hooks/use-filters";
import { FilterConfig } from "@/types/DataTable";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterFieldRenderer } from "./filter-field-renderer";
import { FilterPanel } from "./filter-panel";
import { useInlineOverflow } from "./use-inline-overflow";

/** Field types that render as an inline control; the rest live in the panel only. */
const INLINE_TYPES = new Set(["select", "text", "number"]);
/** Free-text types commit on a debounce; selects commit live. */
const FREE_TEXT_TYPES = new Set(["text", "number"]);
/**
 * Chip width: the floor every chip gets, and the ceiling one may grow to.
 *
 * Chips used to be a flat 160px whatever they held. "Search by customer
 * name..." needs 185px, "Search by product, variant, or location..." ~280px,
 * and even a select's "All sub-categories" overflows once the chevron and clear
 * button have taken their bite — so placeholders across the bar rendered cut
 * off. The copy is translated too, so no single hard-coded width is right in
 * every locale. Each chip is measured against its own placeholder instead.
 */
const ITEM_WIDTH = 160;
const ITEM_MAX_WIDTH = 288;
/** Input padding (px-3 either side) plus a little breathing room. */
const TEXT_CHROME = 32;
/** Padding plus the chevron and clear affordances a select trigger carries. */
const SELECT_CHROME = 56;
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
  // Memoized so inlineEligible below doesn't recompute on every render.
  const fields = useMemo(() => config.fields ?? [], [config.fields]);
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

  /**
   * Width each chip should render at, measured against its own placeholder in
   * the font the bar actually renders in — so a longer string, or a longer
   * translation, widens the box instead of being clipped by it. Never below
   * `ITEM_WIDTH`, so a bar of short filters looks exactly as it did.
   *
   * Measured with canvas rather than a hidden DOM row: one short string per
   * chip and no layout to inherit, so text metrics alone are enough.
   */
  const [textWidths, setTextWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof document === "undefined") return;

    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    const style = getComputedStyle(el);
    context.font = `${style.fontStyle} ${style.fontWeight} 0.875rem ${style.fontFamily}`;

    const next: Record<string, number> = {};
    for (const field of inlineEligible) {
      const text = field.placeholder ?? field.label ?? "";
      const chrome = FREE_TEXT_TYPES.has(field.type)
        ? TEXT_CHROME
        : SELECT_CHROME;
      next[field.name] = Math.round(
        Math.min(
          ITEM_MAX_WIDTH,
          Math.max(ITEM_WIDTH, context.measureText(text).width + chrome),
        ),
      );
    }
    setTextWidths((prev) => {
      const same =
        Object.keys(next).length === Object.keys(prev).length &&
        Object.entries(next).every(([key, value]) => prev[key] === value);
      return same ? prev : next;
    });
  }, [inlineEligible]);

  const widthOf = (field: (typeof inlineEligible)[number]) =>
    textWidths[field.name] ?? ITEM_WIDTH;

  const itemWidths = useMemo(
    () => inlineEligible.map(widthOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inlineEligible, textWidths],
  );

  const visibleCount = useInlineOverflow({
    ref: containerRef,
    itemWidths,
    gap: ITEM_GAP,
    reserved: RESERVED,
  });

  const visibleInline = inlineEligible.slice(0, visibleCount);
  const visibleNames = new Set(visibleInline.map((f) => f.name));
  /** What the panel still has to offer: the overflow plus the panel-only types. */
  const panelFieldNames = fields
    .filter((f) => !visibleNames.has(f.name))
    .map((f) => f.name);
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
      // `basis-full` below `sm`: both toolbars are `flex-wrap` rows that also
      // carry a title and the action buttons, and the title cannot shrink below
      // its text. Sharing one phone-width row left this bar too narrow for even
      // the Filters button plus Reset, which then overflowed the card and got
      // clipped. Taking a row of its own is what the wrap is there for.
      className={cn(
        "flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-0",
        className,
      )}
    >
      {visibleInline.map((field) => {
        if (field.showWhen && !field.showWhen(state.values)) return null;
        const isFreeText = FREE_TEXT_TYPES.has(field.type);
        // Free-text binds to the immediate input mirror (debounced commit);
        // selects bind to the committed value (live commit).
        const value = isFreeText
          ? state.filterInputs[field.name]
          : state.values[field.name];
        const active = Array.isArray(value)
          ? value.length > 0
          : value !== "" && value != null;
        // ITEM_WIDTH is the target width, not a floor — a chip may squeeze when the
        // overflow measurement is momentarily stale (first paint renders them all,
        // before the effect runs). Non-shrinkable chips instead pushed the document
        // wide, and useInlineOverflow then measured that inflated width and latched.
        return (
          <div
            key={field.name}
            className="relative min-w-24 shrink"
            style={{ width: widthOf(field) }}
          >
            {/* Set, a chip shows its value ("EverGood") and nothing else — so
                the filter's name sits on the border, and the box is tinted, or
                three set chips read as three unexplained words. */}
            {active && (
              <span className="pointer-events-none absolute -top-1.5 left-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-sm bg-background px-1 text-[10px] font-medium leading-3 text-primary">
                {field.label}
              </span>
            )}
            <FilterFieldRenderer
              field={field}
              value={value}
              values={state.values}
              hideLabel
              // Sizes the select / text Input / NumberField to match search + button.
              //
              // `min-h-8` is not redundant next to `h-8`: MultiSelect (the tag
              // filter) carries its own `min-h-9` for the taller rows it sits in
              // elsewhere, and `min-height` beats `height`. The chip rendered
              // 36px against its 32px neighbours — a visibly taller box in the
              // middle of the row. twMerge lets the later class win, so stating
              // the floor here is what actually sets the height.
              controlClassName={cn(
                "h-8 min-h-8",
                active && "border-primary/60 bg-primary/5",
              )}
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
          <FilterPanel
            config={config}
            state={state}
            showReset={false}
            fieldNames={panelFieldNames}
            live
          />
        </div>
      )}

      {/* Icon-only below `sm`: the label is the first thing worth dropping when
          the row runs out of width. `outline`, not `ghost`, for exactly that
          state — a bare muted ✕ is the same glyph in the same color as the
          per-field clear button above, so with the label gone the two are
          indistinguishable. The border is what says "button", and it matches
          the Filters trigger it sits beside. Colour does NOT change by
          breakpoint: one control, one colour, at every width. */}
      {state.activeCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          aria-label="Reset filters"
          title="Reset filters"
          className="h-8 w-8 shrink-0 gap-1 px-0 text-muted-foreground hover:text-foreground sm:w-auto sm:px-2.5"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      )}
    </div>
  );
}
