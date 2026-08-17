"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { FieldCaption } from "@/ui/components/field-caption";
import { OptionCard } from "@/ui/components/option-card";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { TemplateSketch } from "@/components/ecommerce/customize/template-sketch";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";

/**
 * The three ways a `TEMPLATE_OPTIONS` key can be rendered, in one file because
 * they are one decision: **which control does this question deserve?**
 *
 *   - `TemplatePicker`  — sketch tiles. The choice is SPATIAL: a merchant cannot
 *     pick a homepage layout or a product page from a dropdown.
 *   - `TemplateSegmented` — one track of steps. The choice is a RAMP: photo
 *     shape, products per row, how the next page loads.
 *   - `TemplateSelect`  — a dropdown with the descriptions inside it. The choice
 *     is a LIST of five or six named things whose sketches all look alike.
 *
 * All three read the same catalogue, so an option's id, label and wording exist
 * once no matter which control renders it.
 */

/**
 * Sketch tiles: a wireframe, the option name, and one line saying what it does.
 *
 * Deliberately never a row of bare text buttons. "Sticky buy bar" and "Bold CTA"
 * are unguessable words for a purely visual decision, and a merchant who can't
 * tell the options apart picks none of them.
 *
 * **Where that line goes is the `caption` prop, and it is not cosmetic.** A
 * description under every tile is read at the width of one grid column — 95px
 * in a 3-up grid inside the 380px rail — so "Fills the frame edge-to-edge;
 * trims whatever doesn't fit" wrapped to four lines and made a four-option
 * picker taller than the phone screen it was describing. In caption mode the
 * sentence is written once, under the grid, at full width, for whichever option
 * is selected. The sketches carry the comparison; the sentence only ever has to
 * explain the choice already made.
 */
export function TemplatePicker({
  templateKey,
  value,
  onChange,
  columns = 3,
  caption = true,
}: {
  templateKey: string;
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3;
  /**
   * One line under the grid describing the selected option, instead of a line
   * under every tile. Pass `false` only where the options must be compared as
   * prose rather than as pictures.
   */
  caption?: boolean;
}) {
  const options = TEMPLATE_OPTIONS[templateKey] ?? [];
  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      <div
        className={
          columns === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-2"
        }
      >
        {options.map((o) => (
          <OptionCard
            key={o.value}
            selected={value === o.value}
            onSelect={() => onChange(o.value)}
            label={o.label}
            description={caption ? undefined : o.description}
            media={<TemplateSketch templateKey={templateKey} value={o.value} />}
          />
        ))}
      </div>
      {caption && selected?.description ? (
        <FieldCaption>{selected.description}</FieldCaption>
      ) : null}
    </div>
  );
}

/**
 * The ramp form — 2 to 4 steps in one track, for a question that is "how much?"
 * rather than "which of these?".
 *
 * `glyph` is optional because some ramps say everything in two words ("Full
 * photo" / "Cropped") and a wireframe under them would be decoration. Where the
 * difference IS the shape, pass one — see `RatioGlyph` in the product-cards
 * block for the pattern.
 */
export function TemplateSegmented({
  templateKey,
  value,
  onChange,
  label,
  glyph,
}: {
  templateKey: string;
  value: string;
  onChange: (value: string) => void;
  /** Names the group for assistive tech — the visible label sits outside. */
  label: string;
  glyph?: (value: string) => ReactNode;
}) {
  const options = TEMPLATE_OPTIONS[templateKey] ?? [];
  return (
    <SegmentedField
      label={label}
      value={value}
      onChange={onChange}
      options={options.map((o) => ({
        value: o.value,
        label: o.label,
        description: o.description,
        glyph: glyph?.(o.value),
      }))}
    />
  );
}

/**
 * The list form — a dropdown whose rows carry the descriptions.
 *
 * For a key with five or six options that are told apart by what they DO rather
 * than by their shape (`cardActions` is the clearest case: "Buy now first",
 * "Show on hover" and "Single + button" all sketch as a card with buttons on
 * it). Closed it is 32px; open, every sentence gets the popover's full width,
 * which is more room than the tile grid ever gave them.
 */
export function TemplateSelect({
  templateKey,
  value,
  onChange,
}: {
  templateKey: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = TEMPLATE_OPTIONS[templateKey] ?? [];
  return (
    <SimpleSelect
      size="sm"
      value={value}
      onValueChange={onChange}
      options={options.map((o) => ({
        value: o.value,
        label: o.label,
        description: o.description,
      }))}
    />
  );
}

