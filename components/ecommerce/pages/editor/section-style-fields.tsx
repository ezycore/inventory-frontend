"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import type { SpacingStep } from "@/lib/storefront-builder/section-style";
import { ColorField, isHexColor } from "@/ui/components/color-field";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { ImageField } from "./image-field";
import { PhoneNote, ResetToDesktop } from "./responsive-note";
import { isCoreSection } from "./section-catalogue";
import type { EditorDevice, EditorSection } from "./section-instances";
import {
  alignFor,
  backgroundOf,
  paddingFor,
  styleOf,
  toneOf,
  widthOf,
  withAlign,
  withBackground,
  withPadding,
  withStyle,
  withTone,
  withWidth,
  type BackgroundKind,
  type SectionStyleBox,
  type StyleEdge,
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
]);

const TONES = withSectionOwn([
  { value: "light", label: "Light, for a dark background" },
  { value: "dark", label: "Dark, for a light background" },
]);

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
 * The inspector's Style tab: the box every section sits in (plan §5.2
 * `SectionStyle`). "Section's own" everywhere leaves the section's
 * own frame alone, so a section nobody styled looks exactly as it did. Spacing and alignment follow
 * the device switch, like responsive settings.
 */
export function SectionStyleFields({
  section,
  device,
  onChange,
}: {
  section: EditorSection;
  device: EditorDevice;
  onChange: (section: EditorSection) => void;
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
          key={section.id}
          color={background.color}
          onChange={(color) => set(withBackground(style, "color", { color }))}
        />
      ) : null}
      {background.kind === "image" ? (
        <ImageField
          label="Background picture"
          value={background.image}
          onChange={(image) => set(withBackground(style, "image", { image }))}
          hint="Covers the whole section. On a dark picture, set Text colour to Light."
        />
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
          (`assertCoreSection`). */}
      {isCoreSection(section.type) ? null : (
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
            onChange={(value) => set(withAlign(style, chosen<"left" | "center">(value), device))}
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
    </div>
  );
}
