"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import type { SpacingStep } from "@/lib/storefront-builder/section-style";
import { MAX_BORDER_WIDTH, MAX_OVERLAY, MIN_BORDER_WIDTH } from "@/lib/storefront-builder/style-specs";
import { ColorField, isHexColor } from "@/ui/components/color-field";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { isFieldVisible } from "./field-visibility";
import { ImageField } from "./image-field";
import { PhoneNote, ResetToDesktop } from "./responsive-note";
import { isCoreSection } from "./section-catalogue";
import type { EditorDevice, EditorSection } from "./section-instances";
import {
  alignFor,
  anchorOf,
  backgroundOf,
  borderOf,
  borderSidesOf,
  borderToneOf,
  borderWidthOf,
  overlayOf,
  paddingFor,
  radiusOf,
  styleOf,
  textColorOf,
  toneOf,
  widthOf,
  withAlign,
  withAnchor,
  withBackground,
  withBorder,
  withBorderSides,
  withBorderTone,
  withBorderWidth,
  withOverlay,
  withPadding,
  withRadius,
  withStyle,
  withTextColor,
  withTone,
  withWidth,
  type BackgroundKind,
  type SectionStyleBox,
  type StyleBorderSides,
  type StyleBorderTone,
  type StyleEdge,
  type StyleRadius,
  type StyleTone,
  type StyleWidth,
} from "./section-style-edits";

/** An unset choice — the section's own frame. */
const DEFAULT = "__default";

/**
 * Every Style choice can be left to the section itself, and that is worth a
 * choice of its own: the section's own frame is what a theme restyles, so a
 * merchant who picks a value here is opting out of the theme for that section.
 * It is named rather than called "Default" for the reason `fieldEmptyChoice`
 * gives — a control has to say where its value comes from.
 */
const withSectionOwn = (options: { value: string; label: string }[]) => [
  { value: DEFAULT, label: "Section's own" },
  ...options,
];

const BACKGROUNDS = withSectionOwn([
  { value: "none", label: "None" },
  { value: "color", label: "Colour" },
  { value: "image", label: "Picture" },
]);

const STEPS = withSectionOwn([
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
]);

const WIDTHS = withSectionOwn([
  { value: "content", label: "Page column" },
  { value: "wide", label: "Wide" },
  { value: "full", label: "Full width" },
]);

/**
 * Sections whose own settings move their text, so the Style tab must not offer
 * a second alignment. Their frames carry `ownsAlign`, which is what stops the
 * stored value applying once the control is gone — the two go together, and a
 * type added here without it leaves an invisible alignment in force.
 */
const SECTIONS_ALIGNING_THEMSELVES = new Set<string>(["hero"]);

const ALIGNS = withSectionOwn([
  { value: "left", label: "Left" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Right" },
]);

const TONES = withSectionOwn([
  { value: "light", label: "Light, for a dark background" },
  { value: "dark", label: "Dark, for a light background" },
  { value: "custom", label: "A colour of my own" },
]);

const RADII = withSectionOwn([
  { value: "none", label: "Square" },
  { value: "sm", label: "Slightly rounded" },
  { value: "md", label: "Rounded" },
  { value: "lg", label: "Very rounded" },
]);

/**
 * The Outline's edges. "All sides" is the UNSET choice, because that is what the
 * switch drew on its own before this control existed — naming it here rather
 * than storing `all` keeps a page that only ever had the switch byte-identical.
 *
 * Worded as above/below rather than top/bottom to match the Spacing controls
 * beside it, and the side edges are not offered alone: they sit at the window,
 * so a merchant asking for "sides" would get two hairlines on the browser edges.
 */
const BORDER_SIDES = [
  { value: DEFAULT, label: "All sides" },
  { value: "top-bottom", label: "Above and below" },
  { value: "top", label: "Above only" },
  { value: "bottom", label: "Below only" },
];

/**
 * The Outline's colour, as theme tones — each resolves per preset and per dark
 * mode, which a typed hex cannot (`SECTION_BORDER_TONES`). Unset is the theme's
 * own line colour, today's hairline.
 */
const BORDER_TONES = [
  { value: DEFAULT, label: "Theme's line colour" },
  { value: "strong", label: "Stronger line" },
  { value: "brand", label: "Brand colour" },
  { value: "accent", label: "Accent colour" },
  { value: "text", label: "Text colour" },
];

const chosen = <T extends string>(value: string): T | undefined => (value === DEFAULT ? undefined : (value as T));

function StyleSelect({
  id,
  label,
  value,
  options,
  onChange,
  note,
  hint,
}: {
  id: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  note?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {note}
      </div>
      <SimpleSelect id={id} value={value ?? DEFAULT} options={options} onValueChange={onChange} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * The background colour box. What is typed is kept here until it is a whole
 * `#RRGGBB` — only then is it written to the section — so a half-typed colour
 * stays in the box instead of being thrown away on the next render.
 */
function BackgroundColour({ color, onChange }: { color?: string; onChange: (color: string | undefined) => void }) {
  const [typed, setTyped] = useState(color ?? "");
  const shown = typed === "" || isHexColor(typed) ? (color ?? "") : typed;
  return (
    <ColorField
      label="Background colour"
      value={shown}
      onChange={(next) => {
        setTyped(next);
        if (next.trim() === "") onChange(undefined);
        else if (isHexColor(next)) onChange(next.trim());
      }}
    />
  );
}

/**
 * The merchant's own text colour, kept as typed until it is a whole `#RRGGBB`
 * — the same behaviour, and the same reason, as `BackgroundColour` above: the
 * backend refuses a partial hex, so writing one as it is typed would make the
 * section unsaveable halfway through the word.
 */
function TextColour({ color, onChange }: { color?: string; onChange: (color: string | undefined) => void }) {
  const [typed, setTyped] = useState(color ?? "");
  const shown = typed === "" || isHexColor(typed) ? (color ?? "") : typed;
  return (
    <ColorField
      label="Its colour"
      value={shown}
      onChange={(next) => {
        setTyped(next);
        if (next.trim() === "") onChange(undefined);
        else if (isHexColor(next)) onChange(next.trim());
      }}
    />
  );
}

/**
 * The section's own name on the page, so a button elsewhere can link to it with
 * `#name`. Kept as typed while it is being written — a name is invalid for as
 * long as it is half-finished — and stored only once it is a name the backend
 * will take.
 */
function AnchorField({
  id,
  anchor,
  others,
  onChange,
}: {
  id: string;
  anchor?: string;
  others: string[];
  onChange: (anchor: string | undefined) => void;
}) {
  const [typed, setTyped] = useState(anchor ?? "");
  const taken = typed.trim() !== "" && others.includes(typed.trim());
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Link name</Label>
      <Input
        id={id}
        value={typed}
        placeholder="order-form"
        onChange={(event) => {
          setTyped(event.target.value);
          onChange(event.target.value);
        }}
      />
      <p className="text-xs text-muted-foreground">
        {taken
          ? "Another section on this page already uses that name."
          : others.length > 0
            ? `Link a button to #${anchor || "this-section"}. Already on this page: ${others.map((name) => `#${name}`).join(", ")}.`
            : "Give the section a name and a button anywhere on the page can link to it with # in front."}
      </p>
    </div>
  );
}

/**
 * The inspector's Style tab: the box every section sits in (plan §5.2
 * `SectionStyle`). "Section's own" everywhere leaves the section's
 * own frame alone, so a section nobody styled looks exactly as it did. Spacing and alignment follow
 * the device switch, like responsive settings.
 */
export function SectionStyleFields({
  section,
  device,
  onChange,
  siblingAnchors = [],
}: {
  section: EditorSection;
  device: EditorDevice;
  onChange: (section: EditorSection) => void;
  /** Link names the rest of the page already uses — suggestions, and a clash warning. */
  siblingAnchors?: string[];
}) {
  const style = styleOf(section);
  const set = (next: SectionStyleBox) => onChange(withStyle(section, next));
  const id = (key: string) => `${section.id}-style-${key}`;

  const background = backgroundOf(style);
  const padding = paddingFor(style, device);
  const align = alignFor(style, device);
  const setEdge = (edge: StyleEdge) => (value: string) =>
    set(withPadding(style, edge, chosen<SpacingStep>(value), device));

  return (
    <div className="space-y-4">
      <StyleSelect
        id={id("background")}
        label="Background"
        value={background.kind}
        options={BACKGROUNDS}
        onChange={(value) => set(withBackground(style, chosen<BackgroundKind>(value)))}
        hint="Leave it on Section's own to keep the background the section brings, if it has one."
      />
      {background.kind === "color" ? (
        <BackgroundColour
          /* Keyed per FIELD, not per section: both colour boxes are children of
             the one list below, so `section.id` alone made them siblings with
             the same key — React warns, and may reuse one's half-typed hex in
             the other. The suffix keeps the remount-on-section-change this key
             exists for. */
          key={`${section.id}-background`}
          color={background.color}
          onChange={(color) => set(withBackground(style, "color", { color }))}
        />
      ) : null}
      {background.kind === "image" ? (
        <>
          <ImageField
            label="Background picture"
            value={background.image}
            onChange={(image) => set(withBackground(style, "image", { image }))}
            hint="Covers the whole section. On a dark picture, set Text colour to Light."
          />
          {/* A colour background has nothing to shade, and shading it would
              darken a colour the merchant chose — so this is drawn for a
              picture only, and `sectionFrame` refuses it for anything else. */}
          <div className="space-y-1.5">
            <Label htmlFor={id("overlay")}>Shade over the picture</Label>
            <NumberField
              id={id("overlay")}
              value={overlayOf(style) ?? null}
              min={0}
              max={MAX_OVERLAY}
              precision={0}
              onChange={(value) => set(withOverlay(style, value ?? undefined))}
            />
            <p className="text-xs text-muted-foreground">
              Darkens the picture behind the words, so the text stays readable. 0 to {MAX_OVERLAY} percent;
              empty leaves the picture as it is.
            </p>
          </div>
        </>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium">Spacing</h4>
          <PhoneNote device={device} own={padding.own} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StyleSelect id={id("top")} label="Above" value={padding.value?.top} options={STEPS} onChange={setEdge("top")} />
          <StyleSelect
            id={id("bottom")}
            label="Below"
            value={padding.value?.bottom}
            options={STEPS}
            onChange={setEdge("bottom")}
          />
        </div>
        <StyleSelect
          id={id("inline")}
          label="Sides"
          value={padding.value?.inline}
          options={STEPS}
          onChange={setEdge("inline")}
          hint="Insets the section from the page's edges. Section's own keeps the page's usual gutter — and on a full-width section, no gutter at all."
        />
        <p className="text-xs text-muted-foreground">
          The room above and below the section. Section&apos;s own, chosen on the desktop, goes back to the
          section&apos;s own spacing on every screen.
        </p>
        <ResetToDesktop
          device={device}
          own={padding.own}
          onReset={() => set(withPadding(style, "top", undefined, device))}
        />
      </div>

      {/* Not for the core section: its view brings its own column and gutter, and
          the frame drops its second gutter only at full width, so a narrower
          choice squeezes the page on a phone. The API refuses it too
          (`assertCoreSection`).

          Nor for a section whose own settings already decide its width — the
          full-bleed hero, whose Layout control is called "Full width" and whose
          frame carries `ownsWidth`. That one is per-SETTINGS, not per type, so
          it reads the same visibility table the Content tab uses rather than a
          set of type names like the alignment gate below. A card or open hero
          has no collision and keeps the control. */}
      {isCoreSection(section.type) ||
      !isFieldVisible("style.width", section.type, {
        settings: section.settings ?? {},
        blocks: (section.blocks ?? []).map((block) => block.settings ?? {}),
      }) ? null : (
        <StyleSelect
          id={id("width")}
          label="Width"
          value={widthOf(style)}
          options={WIDTHS}
          onChange={(value) => set(withWidth(style, chosen<StyleWidth>(value)))}
        />
      )}

      {/* Not for a section that moves its own text. The hero has an Alignment
          control on the Content tab, and offering a second one here gave a
          merchant two controls for one question with no way to tell which had
          won — on a card it centred the headline and left the buttons hard
          left, because they are flex children. `ownsAlign` on the section's
          frame is the other half: without it the frame would keep applying a
          stored value the merchant can no longer see or clear. */}
      {SECTIONS_ALIGNING_THEMSELVES.has(section.type) ? null : (
        <div className="space-y-1.5">
          <StyleSelect
            id={id("align")}
            label="Text alignment"
            value={align.value}
            options={ALIGNS}
            onChange={(value) => set(withAlign(style, chosen<"left" | "center" | "right">(value), device))}
            note={<PhoneNote device={device} own={align.own} />}
          />
          <ResetToDesktop device={device} own={align.own} onReset={() => set(withAlign(style, undefined, device))} />
        </div>
      )}

      <StyleSelect
        id={id("tone")}
        label="Text colour"
        value={toneOf(style)}
        options={TONES}
        onChange={(value) => set(withTone(style, chosen<StyleTone>(value)))}
      />
      {/* Only the merchant's own colour needs a colour box. Switching away keeps
          what they picked (`withTone` leaves `textColor` alone), so coming back
          finds it again. */}
      {toneOf(style) === "custom" ? (
        <TextColour
          key={`${section.id}-text`}
          color={textColorOf(style)}
          onChange={(color) => set(withTextColor(style, color))}
        />
      ) : null}

      {/* Corners and a line around the section's own band.

          ⚠ Not for a full-width section: a band running to the window edge has
          no corner to round, and the stylesheet really does ignore a stored
          radius there (`.sfb-sec[data-width="full"]`). Hiding a control whose
          renderer still drew something would be the lie that rule exists to
          stop. The line stays, because an edge-to-edge band can still carry one
          above and below.

          ⚠ **The test is the width the section DRAWS at, not the one it stores.**
          `widthOf(style)` alone was wrong for every section whose FRAME is
          full-width by default: a core section renders `data-width="full"`
          (`section-registry.tsx`) while its stored width is always unset —
          there is no Width control for it and `assertCoreSection` refuses one on
          the wire — so the guard could never fire and Corners was offered, and
          dead, on all seven of them. The full-bleed hero is the same shape and
          is answered in `field-visibility` beside its Width rule, because there
          it turns on the section's own settings rather than its type. */}
      {isCoreSection(section.type) ||
      widthOf(style) === "full" ||
      !isFieldVisible("style.radius", section.type, {
        settings: section.settings ?? {},
        blocks: (section.blocks ?? []).map((block) => block.settings ?? {}),
      }) ? null : (
        <StyleSelect
          id={id("radius")}
          label="Corners"
          value={radiusOf(style)}
          options={RADII}
          onChange={(value) => set(withRadius(style, chosen<StyleRadius>(value)))}
          hint="Rounds the section's own band. A full-width section stays square."
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Label htmlFor={id("border")}>Outline</Label>
            <p className="text-xs text-muted-foreground">A line around the section, or a rule between two of them.</p>
          </div>
          <Switch
            id={id("border")}
            checked={borderOf(style)}
            onCheckedChange={(checked) => set(withBorder(style, checked))}
          />
        </div>

        {/* The line's own three controls, drawn only while it is on: three rows
            under a switch nobody turned on are rail height with no question in
            it, and `sectionFrame` reads none of them then either. Turning the
            switch off KEEPS them (`withBorder`), so this is hidden, not erased. */}
        {borderOf(style) ? (
          <div className="space-y-3 border-l pl-3">
            <StyleSelect
              id={id("border-sides")}
              label="Which sides"
              value={borderSidesOf(style)}
              options={BORDER_SIDES}
              onChange={(value) => set(withBorderSides(style, chosen<StyleBorderSides>(value)))}
              hint="A section's left and right edges sit at the page's edges, so Above and below is the usual choice for a line between sections."
            />
            <StyleSelect
              id={id("border-tone")}
              label="Line colour"
              value={borderToneOf(style)}
              options={BORDER_TONES}
              onChange={(value) => set(withBorderTone(style, chosen<StyleBorderTone>(value)))}
              hint="Colours from your theme, so the line stays visible in light and dark."
            />
            <div className="space-y-1.5">
              <Label htmlFor={id("border-width")}>Thickness</Label>
              <NumberField
                id={id("border-width")}
                value={borderWidthOf(style) ?? null}
                min={MIN_BORDER_WIDTH}
                max={MAX_BORDER_WIDTH}
                precision={0}
                showSteppers
                onChange={(value) => set(withBorderWidth(style, value ?? undefined))}
              />
              <p className="text-xs text-muted-foreground">
                {MIN_BORDER_WIDTH} to {MAX_BORDER_WIDTH} pixels; empty is a hairline.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <AnchorField
        id={id("anchor")}
        anchor={anchorOf(style)}
        others={siblingAnchors}
        onChange={(anchor) => set(withAnchor(style, anchor))}
      />
    </div>
  );
}
