// coding-standard: maintained

import { cn } from "@/ui/lib/utils";

/**
 * The segment glyphs for the Design part's four ramps — the shrunk-down
 * descendants of the 40px tile sketches this part used to draw above every
 * option.
 *
 * They survive the shrink because they are pure geometry: bar heights, gaps,
 * corner radii, margins. That is the same reason the typeface axis has no glyph
 * at all and never will — a type sample drawn here would be the admin's font
 * wearing the option's name, which is a preview that lies. The live storefront
 * preview beside the rail is the only honest answer for that one.
 *
 * **Everything is `currentColor` and `bg-current`.** The segment owns the
 * selected/rest state and dims its glyph accordingly, so a glyph that set its
 * own colour would stay bright inside an unselected step.
 */

const HEADING_BAR: Record<string, string> = {
  sm: "h-[3px]",
  md: "h-[5px]",
  lg: "h-2",
};

/** A heading over its body copy — the ramp is the heading's weight on the page. */
export function ScaleGlyph({ id }: { id: string }) {
  return (
    <span className="flex w-full flex-col gap-[2px]">
      <span className={cn("block w-3/4 rounded-[1px] bg-current", HEADING_BAR[id])} />
      <span className="block h-[2px] w-full rounded-[1px] bg-current opacity-60" />
    </span>
  );
}

/** Tile count mirrors `--cols` at the widest breakpoint: compact 5, cozy 4, airy 3. */
const DENSITY_SHAPE: Record<string, { tiles: number; gap: string }> = {
  compact: { tiles: 5, gap: "gap-[1px]" },
  cozy: { tiles: 4, gap: "gap-[2px]" },
  airy: { tiles: 3, gap: "gap-1" },
};

export function DensityGlyph({ id }: { id: string }) {
  const shape = DENSITY_SHAPE[id] ?? DENSITY_SHAPE.cozy;
  return (
    <span className={cn("flex h-3 w-full", shape.gap)}>
      {Array.from({ length: shape.tiles }, (_, i) => (
        <span key={i} className="h-full flex-1 rounded-[1px] bg-current" />
      ))}
    </span>
  );
}

/**
 * The card corner each option produces. Literal px rather than the storefront's
 * `--radius-*` tokens — those live under `.sf-root`, which the admin is
 * deliberately not inside, so referencing them would draw every glyph square.
 */
const RADIUS_PX: Record<string, string> = {
  sharp: "1px",
  soft: "4px",
  round: "6px",
  // The glyph draws a CONTROL, so `pill` shows its control step rather than its
  // card step — that is the difference a merchant is picking.
  pill: "999px",
};

export function RadiusGlyph({ id }: { id: string }) {
  return (
    <span
      className="block h-3 w-full border-[1.5px] border-current"
      style={{ borderRadius: RADIUS_PX[id] ?? RADIUS_PX.soft }}
    />
  );
}

/**
 * The page inside the screen: a fixed outer frame with the content block
 * growing to fill it. Drawn rather than described because "wide" and "full" are
 * a spatial difference, and the two words alone leave a merchant guessing which
 * one still has margins.
 */
const WIDTH_INSET: Record<string, string> = {
  contained: "22%",
  wide: "10%",
  full: "0%",
};

export function WidthGlyph({ id }: { id: string }) {
  return (
    <span className="flex h-3 w-full items-stretch border border-current p-[1px]">
      <span
        className="block flex-1 bg-current"
        style={{ marginInline: WIDTH_INSET[id] ?? WIDTH_INSET.contained }}
      />
    </span>
  );
}
