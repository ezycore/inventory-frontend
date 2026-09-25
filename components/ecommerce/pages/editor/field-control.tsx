"use client";
// coding-standard: maintained

import dynamic from "next/dynamic";
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import { NO_ICON } from "@/lib/storefront-builder/section-specs";
import { IconPicker } from "@/components/ecommerce/customize/icon-picker";
import type { IconName } from "@/components/storefront/sf-icons";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { fieldDefaultsOn, fieldEmptyChoice } from "./field-empty-choice";
import { RefField } from "./ref-field";
import { valueLabel } from "./section-catalogue";

// TipTap is heavy: only a page with a rich-text section open pays for it.
const RichTextEditor = dynamic(
  () => import("@/components/shared/rich-text-editor").then((module) => module.RichTextEditor),
  { ssr: false },
);

/** Text allowed past this length gets a multi-line box. */
const LONG_TEXT = 200;
/** An optional list's "not set" choice — what it means is `fieldEmptyChoice`. */
const DEFAULT_CHOICE = "__default";
/** The one setting drawn as a grid of glyphs rather than a list of names. */
const ICON_FIELD = "icon";

/**
 * The input for one setting, chosen by its spec type. Pictures and focus points
 * are drawn by `SettingsFields`, which knows which picture a focus point
 * belongs to; they render nothing here.
 */
export function FieldControl({
  id,
  name,
  sectionType,
  spec,
  value,
  onChange,
}: {
  id: string;
  /** The setting's key — it names options that mirror a Customize choice (`valueLabel`). */
  name: string;
  /** Which section this setting belongs to — what empty means is per section (`fieldEmptyChoice`). */
  sectionType?: string;
  spec: SectionFieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (spec.type) {
    case "string": {
      const text = typeof value === "string" ? value : "";
      return spec.max > LONG_TEXT ? (
        <Textarea
          id={id}
          value={text}
          maxLength={spec.max}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input id={id} value={text} maxLength={spec.max} onChange={(event) => onChange(event.target.value)} />
      );
    }
    case "url":
    case "color":
    case "date":
      return (
        <Input
          id={id}
          value={typeof value === "string" ? value : ""}
          placeholder={spec.type === "url" ? "/products" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "number":
      return (
        <NumberField
          id={id}
          value={typeof value === "number" ? value : null}
          onChange={(next) => onChange(next ?? undefined)}
          min={spec.min}
          max={spec.max}
          precision={spec.int ? 0 : undefined}
        />
      );
    case "boolean":
      /* Unset is not automatically off — see `fieldDefaultsOn`. The switch has
         to show what the section draws, or its first click is a no-op. */
      return (
        <Switch
          id={id}
          checked={typeof value === "boolean" ? value : fieldDefaultsOn(sectionType, name)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case "enum": {
      const empty = spec.optional ? fieldEmptyChoice(sectionType, name) : undefined;
      /* A glyph is chosen by looking at it, not by reading its name off a list
         one row at a time — and only a grid has room for the "No icon" choice,
         which is a stored value here because unset draws a fallback. */
      if (name === ICON_FIELD) {
        return (
          <IconPicker
            id={id}
            value={typeof value === "string" ? value : empty?.kind === "value" ? empty.value : undefined}
            choices={spec.values.filter((option) => option !== NO_ICON) as IconName[]}
            labelOf={(option) => valueLabel(option, name, sectionType)}
            emptyLabel={empty?.kind === "value" ? undefined : (empty?.label ?? (spec.optional ? "Default" : undefined))}
            allowNone={spec.values.includes(NO_ICON)}
            onChange={onChange}
          />
        );
      }
      const options = spec.values.map((option) => ({
        value: option,
        label: valueLabel(option, name, sectionType),
      }));
      // A built-in fallback is not a state of its own: the control shows the
      // value the section already draws, so nothing sits behind a "Default".
      if (empty?.kind === "value") {
        return (
          <SimpleSelect
            id={id}
            value={typeof value === "string" ? value : empty.value}
            options={options}
            onValueChange={onChange}
          />
        );
      }
      const emptyLabel = empty?.label ?? "Default";
      return (
        <SimpleSelect
          id={id}
          value={typeof value === "string" ? value : spec.optional ? DEFAULT_CHOICE : undefined}
          options={spec.optional ? [{ value: DEFAULT_CHOICE, label: emptyLabel }, ...options] : options}
          onValueChange={(next) => onChange(next === DEFAULT_CHOICE ? undefined : next)}
        />
      );
    }
    case "richText":
      return (
        <RichTextEditor
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          maxLength={spec.maxBytes}
          // Which bridge opens a body that is not rich-doc JSON yet. The spec
          // answers it per field, because a content page's body really was
          // markdown while other legacy text is literal — passing nothing here
          // would read every such body as markdown.
          legacyFormat={spec.legacyFormat}
          imageUpload="page"
        />
      );
    case "ref":
      return <RefField id={id} to={spec.to} value={value} onChange={onChange} />;
    case "refs":
      return <RefField id={id} to={spec.to} value={value} onChange={onChange} multiple max={spec.max} />;
    case "image":
    case "focal":
      return null;
  }
}
