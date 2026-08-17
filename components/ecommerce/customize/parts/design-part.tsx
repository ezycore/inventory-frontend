"use client";
// coding-standard: maintained

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  DESIGN_DENSITIES,
  DESIGN_FONTS,
  DEFAULT_DESIGN,
  DESIGN_RADII,
  DESIGN_SCALES,
  DESIGN_SURFACES,
  DESIGN_WIDTHS,
  surfaceSwatch,
  type DesignOption,
  type StoreDesign,
} from "@/lib/storefront-theme";
import { SegmentedField, type SegmentedOption } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SwatchField, type SwatchOption } from "@/ui/components/swatch-field";
import { cn } from "@/ui/lib/utils";
import { PartField, PartHint } from "@/components/ecommerce/customize/part-group";
import {
  DensityGlyph,
  RadiusGlyph,
  ScaleGlyph,
  WidthGlyph,
} from "@/components/ecommerce/customize/parts/design-glyphs";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Design — typeface and spatial rhythm. Sits right under Brand because these are
 * what actually make two shops look like different businesses; brand colour on
 * its own leaves every store recognisably the same site in a different hue.
 *
 * **Six axes in ONE `PartGroup` slot, not six.** This part used to render six
 * `PartBlock`s of `OptionCard` grids and opened to roughly 1,870px — 2.6 screens
 * of the rail for six settings, about half of it per-tile prose read at a 95px
 * column width. The axes are facets of one decision ("what does this shop look
 * like"), so they share a slot and a `space-y-3.5`, which alone recovers the
 * 192px those six `py-4`s were spending.
 *
 * Each axis then gets the control its question actually is:
 *   - **Typeface** is six named things that each need a sentence → a select,
 *     where the sentences live in the popover at full width and cost the closed
 *     part nothing.
 *   - **Surface** is a colour → swatches. The picture is the answer.
 *   - **The four ramps** are "how much?" → segmented, so the steps compare in
 *     one track instead of being read one tile at a time.
 *
 * **The typeface tiles deliberately show no type sample.** The fonts are declared
 * in the storefront route group (`app/(storefront)/fonts.ts`), not the admin, so
 * anything rendered here would be the admin's font wearing the option's name —
 * a preview that lies. The live preview beside the rail is the real storefront
 * and shows the real face, which is what the hint points at.
 */
export function DesignPart({
  draft,
  patch,
}: Pick<CustomizeDraftApi, "draft" | "patch">) {
  const set = (axis: Partial<StoreDesign>) =>
    patch({ design: { ...draft.design, ...axis } });

  // Corners and page width are set once at launch and rarely revisited, so they
  // start folded — but never over a merchant's own answer. A shop already off
  // the default on either axis opens with the group down, or the control would
  // be hiding a setting its owner deliberately changed.
  const [showMore, setShowMore] = useState(
    () =>
      draft.design.radius !== DEFAULT_DESIGN.radius ||
      draft.design.width !== DEFAULT_DESIGN.width,
  );

  return (
    <div className="space-y-3.5">
      <PartField label="Typeface">
        <SimpleSelect
          size="sm"
          value={draft.design.font}
          onValueChange={(font) => set({ font })}
          options={toSelectOptions(DESIGN_FONTS)}
        />
        <PartHint>
          Every option pairs a Latin face with a Bengali one. The preview shows
          the real typeface — this list can only show the names.
        </PartHint>
      </PartField>

      <PartField label="Surface">
        <SwatchField
          label="Surface"
          value={draft.design.surface}
          onChange={(surface) => set({ surface })}
          options={DESIGN_SURFACES.map(toSwatchOption)}
        />
      </PartField>

      <PartField label="Heading size">
        <SegmentedField
          label="Heading size"
          value={draft.design.scale}
          onChange={(scale) => set({ scale })}
          options={inRampOrder("scale", DESIGN_SCALES).map((o) => ({
            ...toSegmentedOption(o),
            glyph: <ScaleGlyph id={o.id} />,
          }))}
        />
      </PartField>

      <PartField
        label="Spacing"
        hint="Also sets how many products sit side by side on a wide screen."
      >
        <SegmentedField
          label="Spacing"
          value={draft.design.density}
          onChange={(density) => set({ density })}
          options={inRampOrder("density", DESIGN_DENSITIES).map((o) => ({
            ...toSegmentedOption(o),
            glyph: <DensityGlyph id={o.id} />,
          }))}
        />
      </PartField>

      <button
        type="button"
        onClick={() => setShowMore((open) => !open)}
        aria-expanded={showMore}
        className="flex w-full items-center gap-2 py-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 transition-transform", showMore && "rotate-90")}
        />
        More options
        <span className="h-px flex-1 bg-border" />
      </button>

      {showMore ? (
        <>
          <PartField
            label="Corners"
            hint="Applies to cards, panels and form fields. Round badges and avatars keep their shape."
          >
            <SegmentedField
              label="Corners"
              value={draft.design.radius}
              onChange={(radius) => set({ radius })}
              options={inRampOrder("radius", DESIGN_RADII).map((o) => ({
                ...toSegmentedOption(o),
                glyph: <RadiusGlyph id={o.id} />,
              }))}
            />
          </PartField>

          <PartField
            label="Page width"
            hint="Wider settings add a column of products rather than stretching the ones you have. Your account pages stay a comfortable width to read."
          >
            <SegmentedField
              label="Page width"
              value={draft.design.width}
              onChange={(width) => set({ width })}
              options={DESIGN_WIDTHS.map((o) => ({
                ...toSegmentedOption(o),
                glyph: <WidthGlyph id={o.id} />,
              }))}
            />
          </PartField>
        </>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * `DesignOption` → each control's option shape. Three one-liners rather than a
 * generic mapper: the catalogue is the single source of the ids, labels and
 * copy, and the only thing that varies is which control consumes them.
 * ------------------------------------------------------------------------- */

/**
 * Display order for the ramps — **not** the catalogue order.
 *
 * `lib/storefront-theme.ts` lists each axis DEFAULT-FIRST, because
 * `DEFAULT_DESIGN` reads `[0]` of every array. That is right for a grid of tiles,
 * where nothing implies a sequence, and wrong for a segmented control, which
 * says "these are steps on a scale" with its shape. Rendered in catalogue order
 * the glyphs stepped 5→3→8px, 4→5→3 tiles and 4→1→6→999px radius — a ramp that
 * ramps in no direction, which is worse than the grid it replaced.
 *
 * Declared here rather than by reordering the catalogue: moving `[0]` would
 * silently change every store's default. `width` needs no entry — contained →
 * wide → full is already in order.
 */
const RAMP_ORDER: Record<string, string[]> = {
  scale: ["sm", "md", "lg"],
  density: ["compact", "cozy", "airy"],
  radius: ["sharp", "soft", "round", "pill"],
};

/**
 * An option the catalogue gains but this map does not keeps its catalogue
 * position at the end rather than vanishing from the control — a new step
 * landing in the wrong slot is a visual bug, one that never renders is a setting
 * a merchant cannot reach.
 */
const inRampOrder = (axis: string, options: DesignOption[]): DesignOption[] => {
  const order = RAMP_ORDER[axis];
  if (!order) return options;
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? order.length : i;
  };
  return [...options].sort((a, b) => rank(a.id) - rank(b.id));
};

const toSelectOptions = (options: DesignOption[]) =>
  options.map((o) => ({
    value: o.id,
    label: o.label,
    description: o.description,
  }));

const toSegmentedOption = (o: DesignOption): SegmentedOption => ({
  value: o.id,
  label: o.label,
  description: o.description,
});

const toSwatchOption = (o: DesignOption): SwatchOption => ({
  value: o.id,
  label: o.label,
  description: o.description,
  // `[page, card, panel]` — the order a shopper meets them stacked. See the
  // note on SURFACE_SWATCH for why these are literals and not storefront tokens.
  colors: surfaceSwatch(o.id),
});

