"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { FieldCaption } from "@/ui/components/field-caption";
import { cn } from "@/ui/lib/utils";

/**
 * One step on a segmented control. `glyph` is a tiny wireframe of what the
 * option does — 28×16 or so, drawn in `currentColor` so it inherits the
 * selected/rest state instead of carrying its own palette.
 */
export interface SegmentedOption {
  value: string;
  label: string;
  glyph?: ReactNode;
  /** One line about this option, surfaced as the caption while it is selected. */
  description?: string;
}

/**
 * The picker for an **ordinal ramp** — small / medium / large, 2 to 4 steps.
 *
 * It exists because a ramp was being drawn as a row of `OptionCard`s, and that
 * is the wrong shape for the question twice over. A card grid asks "which of
 * these things?" when the real question is "how much?", and it pays for a
 * description under every step — in a 380px rail that column is ~95px wide, so
 * "Fills the frame edge-to-edge; trims whatever doesn't fit" wrapped to four
 * lines and one axis cost 260px.
 *
 * Here the steps sit in one track, so the glyphs compare against each other
 * directly rather than being read one at a time, and only the SELECTED option's
 * sentence is rendered — as a caption below. Nothing is hidden that a merchant
 * needs before choosing: the descriptions are differences between neighbours,
 * and the live preview is the real answer either way.
 *
 * Single-choice, but deliberately `aria-pressed` rather than radio semantics —
 * `OptionCard` and `OptionChip` already own that convention on these screens
 * and a second one in the same rail is worse than an imperfect first.
 */
export function SegmentedField({
  value,
  options,
  onChange,
  label,
  caption = true,
  className,
}: {
  value: string;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  /** Names the group for assistive tech — the visible label sits outside. */
  label: string;
  /** Renders the selected option's description underneath. */
  caption?: boolean;
  className?: string;
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        role="group"
        aria-label={label}
        className="flex gap-0.5 rounded-lg border bg-background p-0.5"
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              // `min-w-0` matters: without it a long label ("Full width")
              // sets the flex base and the steps stop being equal widths.
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5",
                "text-[11px] font-medium leading-tight transition-colors outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                on
                  ? "bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_var(--color-primary)]"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {o.glyph ? (
                <span
                  className={cn(
                    "flex h-4 w-7 flex-none items-center justify-center",
                    on ? "opacity-90" : "opacity-55",
                  )}
                >
                  {o.glyph}
                </span>
              ) : null}
              <span className="max-w-full truncate">{o.label}</span>
            </button>
          );
        })}
      </div>
      {caption && selected?.description ? (
        <FieldCaption>{selected.description}</FieldCaption>
      ) : null}
    </div>
  );
}
