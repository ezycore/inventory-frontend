"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import type { SpacingStep } from "@/lib/storefront-builder/section-style";
import { ColorField, isHexColor } from "@/ui/components/color-field";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { ImageField } from "./image-field";
import { PhoneNote, ResetToDesktop } from "./responsive-note";
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

const withDefault = (options: { value: string; label: string }[]) => [{ value: DEFAULT, label: "Default" }, ...options];

const BACKGROUNDS = withDefault([
  { value: "none", label: "None" },
  { value: "color", label: "Colour" },
  { value: "image", label: "Picture" },
]);

const STEPS = withDefault([
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
]);

const WIDTHS = withDefault([
  { value: "content", label: "Page column" },
  { value: "wide", label: "Wide" },
  { value: "full", label: "Full width" },
]);

const ALIGNS = withDefault([
  { value: "left", label: "Left" },
  { value: "center", label: "Centre" },
]);

const TONES = withDefault([
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
 * `SectionStyle`). "Default" everywhere is the section's own frame, so a
 * section nobody styled looks exactly as it did. Spacing and alignment follow
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
        hint="Default keeps the section's own background, if it has one."
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
          The room above and below the section. Default on the desktop goes back to the section&apos;s own spacing
          on every screen.
        </p>
        <ResetToDesktop
          device={device}
          own={padding.own}
          onReset={() => set(withPadding(style, "top", undefined, device))}
        />
      </div>

      <StyleSelect
        id={id("width")}
        label="Width"
        value={widthOf(style)}
        options={WIDTHS}
        onChange={(value) => set(withWidth(style, chosen<StyleWidth>(value)))}
      />

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
