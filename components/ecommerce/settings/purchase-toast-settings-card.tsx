"use client";
// coding-standard: maintained

import { PurchaseToastView } from "@/components/storefront/social-proof/purchase-toast-view";
import type { CSSProperties } from "react";
import { resolveSocialLook, SAMPLE_PRODUCT_PHOTO, shopPreviewVars, timeAgoText, toastText } from "@/lib/storefront-social-proof";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Field, ToggleRow } from "./settings-form-shared";
import { TOAST_TEMPLATE_DEFAULT, type PurchaseToastDraft } from "./social-proof-shared";
import { ToastEntriesEditor } from "./toast-entries-editor";

/** The admin has none of the shop's colour tokens; the preview draws on a plain light shop. */
const PREVIEW_VARS = shopPreviewVars("#2563eb") as CSSProperties;

const SOURCES = [
  { value: "real", label: "Real orders (recommended)", description: "Your shop's own recent orders. True, and shoppers can tell." },
  { value: "mixed", label: "Real orders, topped up with my entries", description: "Your entries fill in while there are fewer than 5 recent orders." },
  { value: "custom", label: "My entries only", description: "Only the lines you write below." },
];
const NAME = [
  { value: "first", label: "First name", description: "“Rahim” — never the surname or phone" },
  { value: "hidden", label: "Hidden", description: "“Someone”" },
];
const AREA = [
  { value: "district", label: "District", description: "“Dhaka”" },
  { value: "area", label: "Area", description: "“Mirpur”, or the district when no area was given" },
  { value: "hidden", label: "Hidden", description: "No place in the message" },
];
const POSITION = [
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

/** The purchase toast's switch, source, timing and message. Colours and size live in Customize. */
export function PurchaseToastSettingsCard({
  value,
  onChange,
}: {
  value: PurchaseToastDraft;
  onChange: (patch: Partial<PurchaseToastDraft>) => void;
}) {
  const fields = value.fields ?? {};
  const setField = (patch: Partial<NonNullable<PurchaseToastDraft["fields"]>>) =>
    onChange({ fields: { ...fields, ...patch } });
  const template = value.template?.en?.trim() || TOAST_TEMPLATE_DEFAULT.en;
  const sample = {
    productSlug: "",
    name: fields.name === "hidden" ? undefined : "Rahim",
    area: fields.area === "hidden" ? undefined : fields.area === "area" ? "Mirpur" : "Dhaka",
    productName: fields.product === false ? undefined : "Cotton Panjabi",
  };
  const number = (key: "firstDelaySeconds" | "staySeconds" | "gapSeconds" | "maxPerVisit" | "realWindowDays", min: number, max: number, fallback: number) => (
    <NumberField min={min} max={max} precision={0} value={value[key] ?? fallback} onChange={(n) => onChange({ [key]: n ?? fallback })} />
  );

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <ToggleRow
        label="Recent purchase popup"
        desc="A small note in a bottom corner — “Rahim from Dhaka bought …” — then the next one after a pause."
        checked={!!value.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />
      {value.enabled ? (
        <>
          <Field label="Where the purchases come from">
            <SimpleSelect value={value.source ?? "real"} onValueChange={(source) => onChange({ source: source as PurchaseToastDraft["source"] })} options={SOURCES} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="First after (sec)">{number("firstDelaySeconds", 0, 120, 8)}</Field>
            <Field label="Stays for (sec)">{number("staySeconds", 3, 30, 6)}</Field>
            <Field label="Gap between (sec)">{number("gapSeconds", 5, 600, 30)}</Field>
            <Field label="Most per visit">{number("maxPerVisit", 1, 50, 5)}</Field>
          </div>
          {value.source !== "custom" ? (
            <Field label="Use orders from the last (days)">{number("realWindowDays", 1, 90, 7)}</Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <SegmentedField label="Name" value={fields.name ?? "first"} options={NAME} onChange={(name) => setField({ name: name as "first" | "hidden" })} />
            </Field>
            <Field label="Place">
              <SegmentedField label="Place" value={fields.area ?? "district"} options={AREA} onChange={(area) => setField({ area: area as "area" | "district" | "hidden" })} />
            </Field>
          </div>
          <div className="space-y-3">
            <ToggleRow label="Product name" checked={fields.product !== false} onChange={(product) => setField({ product })} />
            <ToggleRow label="Product photo" checked={fields.image !== false} onChange={(image) => setField({ image })} />
            <ToggleRow label="How long ago" checked={fields.time !== false} onChange={(time) => setField({ time })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Message (English)">
              <Input value={value.template?.en ?? ""} maxLength={120} placeholder={TOAST_TEMPLATE_DEFAULT.en} onChange={(e) => onChange({ template: { ...value.template, en: e.target.value } })} />
            </Field>
            <Field label="Message (Bangla)">
              <Input value={value.template?.bn ?? ""} maxLength={120} placeholder={TOAST_TEMPLATE_DEFAULT.bn} onChange={(e) => onChange({ template: { ...value.template, bn: e.target.value } })} />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {"{name}"}, {"{area}"} and {"{product}"} are filled in. A part you switched off reads “Someone” or is left out.
          </p>
          <Field label="Position">
            <SegmentedField label="Position" value={value.position ?? "bottom-left"} options={POSITION} onChange={(position) => onChange({ position: position as PurchaseToastDraft["position"] })} />
          </Field>
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Preview</p>
            <div style={PREVIEW_VARS}>
              <PurchaseToastView
                look={resolveSocialLook(undefined)}
                text={toastText(sample, template, "en")}
                timeText={fields.time === false ? undefined : timeAgoText(12, "en")}
                imageUrl={fields.image === false ? undefined : SAMPLE_PRODUCT_PHOTO}
                closeLabel="Dismiss"
                onClose={() => undefined}
              />
            </div>
            <p className="text-xs text-muted-foreground">Colours, size and corners: Online store → Customize → Social proof.</p>
          </div>
          {value.source !== "real" ? (
            <ToastEntriesEditor entries={value.entries ?? []} onChange={(entries) => onChange({ entries })} />
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
