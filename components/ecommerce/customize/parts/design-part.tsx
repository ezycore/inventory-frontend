"use client";
// coding-standard: maintained

import {
  DESIGN_DENSITIES,
  DESIGN_FONTS,
  DESIGN_RADII,
  DESIGN_SCALES,
  DESIGN_SURFACES,
  DESIGN_WIDTHS,
  surfaceSwatch,
  type StoreDesign,
} from "@/lib/storefront-theme";
import { OptionCard } from "@/ui/components/option-card";
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Design — typeface and spatial rhythm. Sits right under Brand because these are
 * what actually make two shops look like different businesses; brand colour on
 * its own leaves every store recognisably the same site in a different hue.
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

  return (
    <>
      <PartBlock
        label="Typeface"
        hint="Every option pairs a Latin face with a Bengali one, so your shop reads properly in both languages."
      >
        <div className="grid gap-2">
          {DESIGN_FONTS.map((font) => (
            <OptionCard
              key={font.id}
              selected={draft.design.font === font.id}
              onSelect={() => set({ font: font.id })}
              label={font.label}
              description={font.description}
            />
          ))}
        </div>
        <PartHint>
          The preview shows the real typeface — these tiles use the admin&apos;s font.
        </PartHint>
      </PartBlock>

      <PartBlock
        label="Surface"
        hint="The ground your shop is printed on. Your brand colour sits on top of it and is not changed."
      >
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_SURFACES.map((surface) => (
            <OptionCard
              key={surface.id}
              selected={draft.design.surface === surface.id}
              onSelect={() => set({ surface: surface.id })}
              label={surface.label}
              description={surface.description}
              media={<SurfaceSwatch id={surface.id} />}
            />
          ))}
        </div>
      </PartBlock>

      <PartBlock label="Heading size">
        <div className="grid grid-cols-3 gap-2">
          {DESIGN_SCALES.map((scale) => (
            <OptionCard
              key={scale.id}
              selected={draft.design.scale === scale.id}
              onSelect={() => set({ scale: scale.id })}
              label={scale.label}
              description={scale.description}
              media={<ScaleSketch id={scale.id} />}
            />
          ))}
        </div>
      </PartBlock>

      <PartBlock
        label="Spacing"
        hint="Also sets how many products sit side by side on a wide screen."
      >
        <div className="grid grid-cols-3 gap-2">
          {DESIGN_DENSITIES.map((density) => (
            <OptionCard
              key={density.id}
              selected={draft.design.density === density.id}
              onSelect={() => set({ density: density.id })}
              label={density.label}
              description={density.description}
              media={<DensitySketch id={density.id} />}
            />
          ))}
        </div>
      </PartBlock>

      <PartBlock
        label="Corners"
        hint="Applies to cards, panels and form fields. Round badges and avatars keep their shape."
      >
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_RADII.map((radius) => (
            <OptionCard
              key={radius.id}
              selected={draft.design.radius === radius.id}
              onSelect={() => set({ radius: radius.id })}
              label={radius.label}
              description={radius.description}
              media={<RadiusSketch id={radius.id} />}
            />
          ))}
        </div>
      </PartBlock>

      <PartBlock
        label="Page width"
        hint="Wider settings add a column of products rather than stretching the ones you have. Your account pages stay a comfortable width to read."
      >
        <div className="grid grid-cols-3 gap-2">
          {DESIGN_WIDTHS.map((width) => (
            <OptionCard
              key={width.id}
              selected={draft.design.width === width.id}
              onSelect={() => set({ width: width.id })}
              label={width.label}
              description={width.description}
              media={<WidthSketch id={width.id} />}
            />
          ))}
        </div>
      </PartBlock>
    </>
  );
}

/**
 * The page inside the screen, at a glance: a fixed outer frame with the content
 * block growing to fill it. Drawn rather than described because "wide" and
 * "full" are a spatial difference, and the two words alone leave a merchant
 * guessing which one still has margins.
 */
function WidthSketch({ id }: { id: string }) {
  const inset = id === "full" ? "0%" : id === "wide" ? "8%" : "18%";
  return (
    <span className="flex h-10 w-full items-center rounded-md border bg-muted/40 p-1">
      <span
        className="h-full rounded-sm bg-foreground/25"
        style={{ marginInline: inset, width: "100%" }}
      />
    </span>
  );
}

/**
 * Surface is the one axis whose tile can show the real thing: a colour is a
 * colour in any design system, where a typeface is not (see the note on this
 * component). The swatches are shared with the theme-store tile and live beside
 * the catalogue in `lib/storefront-theme.ts` — see the note there on why they
 * are literals rather than the storefront's own tokens.
 */
function SurfaceSwatch({ id }: { id: string }) {
  const [page, card, panel] = surfaceSwatch(id);
  return (
    <span
      className="flex h-10 w-full items-center gap-1 rounded-md border p-1.5"
      style={{ background: page }}
    >
      <span
        className="h-full flex-1 rounded-sm border border-black/5"
        style={{ background: card }}
      />
      <span className="h-full flex-1 rounded-sm" style={{ background: panel }} />
    </span>
  );
}

/**
 * Wireframes, not type samples. Both axes are pure geometry — bar heights and
 * gaps — so a sketch drawn in the admin's own font still tells the truth about
 * them, which is exactly what the typeface tiles above cannot do.
 */
const SKETCH_FRAME =
  "flex w-full flex-col justify-center rounded-md border bg-muted/40 p-1.5";

const HEADING_BAR: Record<string, string> = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };

function ScaleSketch({ id }: { id: string }) {
  return (
    <span className={`${SKETCH_FRAME} h-10 gap-1`}>
      <span className={`block w-3/4 rounded-full bg-foreground/50 ${HEADING_BAR[id]}`} />
      <span className="block h-[3px] w-full rounded-full bg-border" />
      <span className="block h-[3px] w-5/6 rounded-full bg-border" />
    </span>
  );
}

/** Tile count mirrors `--cols` at the widest breakpoint: compact 5, cozy 4, airy 3. */
const DENSITY_SHAPE: Record<string, { tiles: number; gap: string; pad: string }> = {
  compact: { tiles: 5, gap: "gap-[2px]", pad: "p-1" },
  cozy: { tiles: 4, gap: "gap-[3px]", pad: "p-1.5" },
  airy: { tiles: 3, gap: "gap-1.5", pad: "p-2.5" },
};

function DensitySketch({ id }: { id: string }) {
  const shape = DENSITY_SHAPE[id] ?? DENSITY_SHAPE.cozy;
  return (
    <span className={`${SKETCH_FRAME} h-10 ${shape.pad}`}>
      <span className={`flex ${shape.gap}`}>
        {Array.from({ length: shape.tiles }, (_, i) => (
          <span key={i} className="h-5 flex-1 rounded-sm bg-border" />
        ))}
      </span>
    </span>
  );
}

/**
 * The card corner each option produces. Drawn with literal px rather than the
 * storefront's `--radius-*` tokens — those live under `.sf-root`, which the
 * admin is deliberately not inside, so referencing them here would render every
 * tile identically square.
 */
const RADIUS_PX: Record<string, string> = {
  sharp: "4px",
  soft: "12px",
  round: "18px",
  // The sketch draws a CONTROL, so `pill` shows its control step (999px) rather
  // than its card step — that is the difference a merchant is picking.
  pill: "999px",
};

function RadiusSketch({ id }: { id: string }) {
  return (
    <span className={`${SKETCH_FRAME} h-10 items-center`}>
      <span
        className="mx-auto block h-7 w-full border bg-background"
        style={{ borderRadius: RADIUS_PX[id] ?? RADIUS_PX.soft }}
      />
    </span>
  );
}
