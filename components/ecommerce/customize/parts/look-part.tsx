"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useUpdateStorefrontMedia } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import {
  DESIGN_DENSITIES,
  DESIGN_FONTS,
  DEFAULT_DESIGN,
  DESIGN_RADII,
  DESIGN_SCALES,
  DESIGN_SURFACES,
  DESIGN_WIDTHS,
  getPreset,
  surfaceSwatch,
  type DesignOption,
  type StoreDesign,
} from "@/lib/storefront-theme";
import { RECOMMENDED } from "@/lib/image-ratio";
import { logoImageUrl } from "@/lib/storefront-image";
import { SegmentedField, type SegmentedOption } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SwatchField, type SwatchOption } from "@/ui/components/swatch-field";
import { cn } from "@/ui/lib/utils";
import {
  PartBlock,
  PartField,
  PartHint,
} from "@/components/ecommerce/customize/part-group";
import { BrandColorsField } from "@/components/ecommerce/customize/brand-colors-field";
import { LogoStyleField } from "@/components/ecommerce/customize/logo-style-field";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import { PresetTiles } from "@/components/ecommerce/customize/preset-tiles";
import { StartHere } from "@/components/ecommerce/customize/parts/start-here";
import {
  DensityGlyph,
  RadiusGlyph,
  ScaleGlyph,
  WidthGlyph,
} from "@/components/ecommerce/customize/parts/design-glyphs";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Look — everything that decides whether a shop looks like itself: the logo,
 * the two colours, the palette it is printed on, the typeface and the spatial
 * rhythm.
 *
 * **This was two parts, `Brand` and `Design`, until 2026-09-06.** Both sat at
 * 12% adoption against 51-67% for the parts named after something a merchant
 * can see on their own website, and the split was almost certainly why: colour
 * lived in *both* of them — `Brand` held the brand and accent hex, `Design`
 * held the surface, which is the page, card, text and border colours — so
 * "where do I change my shop's colours?" had two equally abstract answers and
 * no way to tell which was which. Merging removes a row from the rail and adds
 * no setting.
 *
 * The blocks are the merchant's questions in the order they matter: what should
 * I do first, what is my mark, what are my colours, what is it printed on, what
 * is it set in, and how much room does it get.
 *
 * **The typeface tiles deliberately show no type sample.** The fonts are
 * declared in the storefront route group (`app/(storefront)/fonts.ts`), not the
 * admin, so anything rendered here would be the admin's font wearing the
 * option's name — a preview that lies. The live preview beside the rail is the
 * real storefront and shows the real face, which is what the hint points at.
 */
export function LookPart({
  settings,
  draft,
  patch,
}: {
  settings: StorefrontSettings;
} & Pick<CustomizeDraftApi, "draft" | "patch">) {
  const media = useUpdateStorefrontMedia();
  // The shop inherits the organization logo unless a store-specific one is
  // uploaded (the public payload falls back server-side the same way).
  const orgLogo = useAuthStore((s) => s.user?.organization?.logo);
  const logoInput = useRef<HTMLInputElement>(null);
  /* The mark actually on the shop right now — the store's own, else the
     organization's, matching what the public payload resolves to.
     Through `logoImageUrl`, which is what the shop header uses: this read the
     200×200 thumbnail first, and that variant is a `fit: "cover"` centre crop,
     so every preview in this panel showed a merchant the middle slice of their
     own wordmark while the real shop beside it rendered it in full. */
  const logoUrl = logoImageUrl(settings.logo) ?? logoImageUrl(orgLogo);

  const set = (axis: Partial<StoreDesign>) =>
    patch({ design: { ...draft.design, ...axis } });

  const pickPreset = (id: string) => {
    const def = getPreset(id);
    patch({ preset: id, brandColor: def.brandColor, accentColor: def.accentColor });
  };

  const uploadLogo = (file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    media.mutate(fd);
  };
  const removeLogo = () => {
    const fd = new FormData();
    fd.append("removeLogo", "true");
    media.mutate(fd);
  };

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
    <>
      <StartHere draft={draft} hasLogo={!!logoUrl} />

      <PartBlock label="Logo">
        <MediaField
          label="Logo"
          url={logoUrl}
          inputRef={logoInput}
          disabled={media.isPending}
          busy={media.isPending}
          onPick={uploadLogo}
          onRemove={settings.logo ? removeLogo : undefined}
          hint="600 × 200 px (up to 3:1) works best — the header shows it at 42px tall by default."
          recommended={RECOMMENDED.storeLogo}
        />
        <PartHint>
          {settings.logo
            ? "Uploads save immediately. Remove it to fall back to your organization logo."
            : orgLogo
              ? "Currently showing your organization logo. Uploading here overrides it for the store only, and saves immediately."
              : "Uploads save immediately. Set an organization logo instead to use one mark everywhere."}
        </PartHint>
      </PartBlock>

      {/* Chrome, not media — these ride the page's single Save, unlike the file
          above. Only worth showing once there is a logo to apply them to. */}
      {logoUrl ? (
        <PartBlock
          label="Logo display"
          hint="A logo drawn in one flat colour disappears on the shop theme that matches it — black type on the dark theme, white type on the light one. A backdrop fixes both at once."
        >
          <LogoStyleField
            value={draft.logoStyle}
            onChange={(logoStyle) => patch({ logoStyle })}
            logoUrl={logoUrl}
          />
        </PartBlock>
      ) : null}

      {/* One block, because these ARE one question. The tiles are four ready
          pairs and the two pickers are the same answer given exactly; splitting
          them into "Preset" and "Colours" was most of what made a merchant guess
          which of two panels held their shop's colour. */}
      <PartBlock
        label="Your colours"
        hint="Start from a pair, then set either colour exactly."
      >
        <PresetTiles preset={draft.preset} onPick={pickPreset} />
        <div className="mt-3">
          <BrandColorsField
            brandColor={draft.brandColor}
            accentColor={draft.accentColor}
            setBrandColor={(brandColor) => patch({ brandColor })}
            setAccentColor={(accentColor) => patch({ accentColor })}
          />
        </div>
      </PartBlock>

      {/* The remaining axes share ONE block rather than taking five. They are
          facets of a single decision ("what does this shop look like"), and the
          part they came from opened to roughly 1,870px — 2.6 screens of rail —
          when each had a block of its own. Each axis still gets the control its
          question actually is: a colour is a swatch, "how much?" is a segmented
          ramp, and six named things that each need a sentence is a select whose
          sentences live in the popover at full width. */}
      <PartBlock label="Type and rhythm">
        <div className="space-y-3.5">
          <PartField label="Palette">
            <SwatchField
              label="Palette"
              value={draft.design.surface}
              onChange={(surface) => set({ surface })}
              options={DESIGN_SURFACES.map(toSwatchOption)}
            />
            <PartHint>
              The paper your shop is printed on — page, cards and hairlines. Your
              own colours sit on top of it and never change with it.
            </PartHint>
          </PartField>

          <PartField label="Typeface">
            <SimpleSelect
              size="sm"
              value={draft.design.font}
              onValueChange={(font) => set({ font })}
              options={toSelectOptions(DESIGN_FONTS)}
            />
            <PartHint>
              Every option pairs a Latin face with a Bengali one. The preview
              shows the real typeface — this list can only show the names.
            </PartHint>
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
      </PartBlock>
    </>
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
