"use client";
// coding-standard: maintained

import { FieldCaption } from "@/ui/components/field-caption";
import { cn } from "@/ui/lib/utils";

/**
 * One swatch. `colors` is `[ground, ...bands]` — the first paints the tile and
 * the rest sit on top of it as equal columns, which is the order a shopper
 * meets them stacked (page, then card, then panel).
 *
 * They are literal colours, never theme tokens: these previews describe the
 * STOREFRONT, and the admin is not inside `.sf-root`, so a token here would
 * paint every swatch the admin's own grey.
 */
export interface SwatchOption {
  value: string;
  label: string;
  colors: string[];
  description?: string;
}

/**
 * The picker for a choice that **is** a colour — a surface, a palette preset,
 * an announcement background.
 *
 * The point is that the description is redundant here in a way it is not for a
 * layout: "Warm parchment — cream ground with tan panels" tells a merchant
 * strictly less than the parchment itself does, and it was costing two wrapped
 * lines under every tile. So the swatch carries the answer, the label names it
 * so it can be talked about, and the sentence moves to a caption for whichever
 * one is selected.
 *
 * Sits beside `ColorField`, not inside it: that one edits an arbitrary hex, this
 * one picks from a fixed set. Neither is a special case of the other.
 */
export function SwatchField({
  value,
  options,
  onChange,
  label,
  caption = true,
  className,
}: {
  value: string;
  options: SwatchOption[];
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
      {/* A WRAPPING grid, not a flex row. This started as `flex gap-2` with
          `flex-1` tiles, which is the same thing while a catalogue has three or
          four entries and silently wrong past that: at eight surfaces inside a
          390px rail every tile fell to ~40px and its name wrapped to four lines
          of two characters. `auto-fit` keeps the small case identical — three
          options still fill the row one third each — and wraps the large one
          into rows of four rather than shrinking past legibility. */}
      <div
        role="group"
        aria-label={label}
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))" }}
      >
        {options.map((o) => {
          const on = o.value === value;
          const [ground, ...bands] = o.colors;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              title={o.description}
              className={cn(
                "min-w-0 rounded-lg border p-1 transition-colors outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                on
                  ? "border-primary ring-2 ring-primary/30"
                  : "hover:border-foreground/20 hover:bg-muted/40",
              )}
            >
              <span
                className="flex h-6 items-stretch gap-1 rounded-md p-1"
                style={{ background: ground }}
              >
                {bands.map((c, i) => (
                  <span
                    key={i}
                    // A hairline in a neutral ink, not a theme border: a white
                    // card on a near-white page is otherwise invisible, which
                    // is exactly the surface a merchant most needs to see.
                    className="min-w-0 flex-1 rounded-sm border border-black/5"
                    style={{ background: c }}
                  />
                ))}
              </span>
              {/* Wraps rather than truncates. In a 3-up row inside a 390px
                  phone rail each swatch is ~113px, where "Warm parchment"
                  ellipsed to "Warm parchm…" — and the ellipsis lands on the one
                  word that distinguishes it. The buttons are flex siblings, so
                  one wrapping to two lines simply makes all three that tall. */}
              <span
                className={cn(
                  "mt-1 block px-0.5 pb-0.5 text-[11px] font-medium leading-tight",
                  on ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {o.label}
              </span>
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
