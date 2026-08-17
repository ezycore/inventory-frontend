"use client";
// coding-standard: maintained

import { mediaRatioFor } from "@/lib/storefront-templates";
import type { StoreTemplates } from "@/lib/storefront-client";
import {
  PartBlock,
  PartField,
} from "@/components/ecommerce/customize/part-group";
import {
  TemplatePicker,
  TemplateSegmented,
  TemplateSelect,
} from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Product cards — how much room a card takes, what it offers, and the frame its
 * photo sits in.
 *
 * Lifted out of `parts-rail.tsx`, where it was the largest of the two inline
 * bodies and the reason that file sat over the component size limit.
 *
 * Three questions, three controls, and the split is the point. Card style is
 * spatial, so it keeps its sketches. Card buttons are six options that all
 * sketch as "a card with buttons on it" and are told apart only by what they
 * do — a list, where each option's sentence gets the popover's full width. The
 * two photo settings are one question in two halves (a frame, and what happens
 * to a photo that doesn't match it), so they share a block and are ramps.
 */
export function CardsPart({
  draft,
  patchTemplate,
}: Pick<CustomizeDraftApi, "draft" | "patchTemplate">) {
  return (
    <>
      <PartBlock label="Card style">
        <TemplatePicker
          templateKey="productCard"
          value={draft.templates.productCard}
          onChange={(v) => patchTemplate("productCard", v)}
          // Four options: 2×2 rather than 3+1, which left an orphan tile on a
          // row of its own and read as a fourth option that mattered less.
          columns={2}
        />
      </PartBlock>

      <PartBlock
        label="Buttons on each card"
        hint="Independent of the style above — a compact card can still show two buttons."
      >
        <TemplateSelect
          templateKey="cardActions"
          value={draft.templates.cardActions}
          onChange={(v) => patchTemplate("cardActions", v)}
        />
      </PartBlock>

      <PartBlock label="Product photos">
        <PartField
          label="Photo shape"
          hint="Cart and search thumbnails stay square so their rows keep their shape."
        >
          <TemplateSegmented
            templateKey="imageRatio"
            label="Photo shape"
            value={draft.templates.imageRatio}
            onChange={(v) => patchTemplate("imageRatio", v)}
            glyph={(v) => <RatioGlyph value={v} />}
          />
        </PartField>

        <PartField label="Image fit">
          <TemplateSegmented
            templateKey="imageFit"
            label="Image fit"
            value={draft.templates.imageFit}
            onChange={(v) => patchTemplate("imageFit", v)}
          />
        </PartField>
      </PartBlock>
    </>
  );
}

/**
 * The frame each ratio produces, drawn at the segment's own scale.
 *
 * **The ratio comes from `mediaRatioFor` — the same function the storefront grid
 * and the live preview paint with — never a hand-copied table.** The first
 * version of this glyph carried its own px map and every entry was wrong:
 * landscape drawn at 1.60 against a real 1.33, tall at 0.50 against 0.67, which
 * made the drawn "portrait" closer to the real "tall" than to real portrait. A
 * picker whose picture disagrees with the page it configures is worse than one
 * with no picture.
 *
 * Height is fixed and the width follows from `aspect-ratio`, rather than the
 * reverse: the glyph slot is wider than it is tall, so sizing off the width
 * would draw `tall` LARGER than `square` and inverts the whole point. The widest
 * result is landscape at 14 × 4/3 ≈ 18.7px, comfortably inside the 28px slot —
 * which is the bound that stops this repeating the aspect-box overflow noted in
 * `template-sketch.tsx`.
 *
 * Portrait (3/4) and Extra tall (2/3) are only 11% apart, so at 14px they look
 * similar. That is the truth about them; the labels and the live preview carry
 * the rest. Drawing them further apart to look more distinct is the exact lie
 * this comment exists to prevent.
 */
function RatioGlyph({ value }: { value: string }) {
  return (
    <span
      className="block rounded-[1px] border-[1.5px] border-current"
      style={{
        height: 14,
        aspectRatio: mediaRatioFor(value as StoreTemplates["imageRatio"]),
      }}
    />
  );
}
