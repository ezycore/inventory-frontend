"use client";
// coding-standard: maintained

import type { SectionFieldSpec, SectionPageContext } from "@/lib/storefront-builder/field-specs";
import type { StoreFocalPoint } from "@/lib/storefront-focal";
import { Label } from "@/ui/components/label";
import { FocalPointPicker } from "@/components/ecommerce/customize/focal-point-picker";
import { FieldControl } from "./field-control";
import { isFieldVisible } from "./field-visibility";
import { ImageField } from "./image-field";
import { PhoneNote, ResetToDesktop } from "./responsive-note";
import { fieldHint, fieldLabel } from "./section-catalogue";
import {
  fieldValue,
  hasPhoneValue,
  withFieldValue,
  type EditorDevice,
} from "./section-instances";

const pictureUrl = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { url } = value as { url?: unknown };
  return typeof url === "string" ? url : undefined;
};

/**
 * Every setting of a section or of one of its items, in spec order.
 *
 * On a responsive setting the device switch decides which value is edited: the
 * desktop value, or the phone's — which follows the desktop until it is set, and
 * can be reset back to it. A focus point is edited over the picture it belongs to
 * (the phone picture, on a phone, when there is one) and is hidden until there is
 * a picture to point at. A setting the page supplies itself (`fromPage` — the
 * product page's product) is not offered; a line says where it comes from.
 *
 * A setting that would do NOTHING in this section's current configuration is not
 * drawn at all — no label, no line, nothing (`field-visibility.ts`). That is the
 * second visibility concept here and it is not the same as `fromPage`: one says
 * "this value comes from elsewhere", the other says "this control has no effect
 * here". A hidden control keeps its stored value, so restoring the configuration
 * brings the merchant's earlier choice back untouched.
 */
export function SettingsFields({
  idPrefix,
  sectionType,
  specs,
  settings,
  device,
  sectionSettings,
  blocks = [],
  blockIndex,
  context,
  onChange,
}: {
  idPrefix: string;
  /** The section these settings belong to — what an empty list means is per section. */
  sectionType?: string;
  specs: Record<string, SectionFieldSpec>;
  settings: Record<string, unknown>;
  device: EditorDevice;
  /**
   * The whole section, for the visibility rules. A BLOCK's field often turns on
   * something outside its own block — a slide's focus point on the section's
   * layout, say — and `settings` above is only the block's when this list is
   * drawing one, which is why these are separate props rather than derived.
   */
  sectionSettings?: Record<string, unknown>;
  blocks?: readonly Record<string, unknown>[];
  /** Set when this list is drawing a block's settings, not the section's. */
  blockIndex?: number;
  /** The page being edited. */
  context?: SectionPageContext;
  onChange: (settings: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(specs).map(([key, spec]) => {
        if (!isFieldVisible(key, sectionType, { settings: sectionSettings ?? settings, blocks, blockIndex })) {
          return null;
        }
        const id = `${idPrefix}-${key}`;
        const label = fieldLabel(key, sectionType);
        if (context && spec.fromPage?.includes(context)) {
          return (
            <p key={key} className="text-sm text-muted-foreground">
              {label}: the one this page shows.
            </p>
          );
        }
        const hint = fieldHint(key, sectionType);
        const value = fieldValue(settings, key, spec, device);
        const set = (next: unknown) => onChange(withFieldValue(settings, key, spec, next, device));
        const ownPhoneValue = hasPhoneValue(settings, key, spec);

        const phoneNote = spec.responsive ? <PhoneNote device={device} own={ownPhoneValue} /> : null;
        const resetToDesktop = <ResetToDesktop device={device} own={ownPhoneValue} onReset={() => set(undefined)} />;

        if (spec.type === "image") {
          return <ImageField key={key} label={label} value={value} onChange={set} hint={hint} />;
        }

        if (spec.type === "focal") {
          const url =
            (device === "mobile" ? pictureUrl(settings.mobileImage) : undefined) ?? pictureUrl(settings.image);
          if (!url) return null;
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{label}</Label>
                {phoneNote}
              </div>
              <FocalPointPicker
                url={url}
                value={value as StoreFocalPoint | undefined}
                onChange={(focal) => set(focal)}
              />
              {resetToDesktop}
            </div>
          );
        }

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={id}>
                {label}
                {spec.optional ? null : <span className="text-red-500"> *</span>}
              </Label>
              {phoneNote}
            </div>
            <FieldControl id={id} name={key} sectionType={sectionType} spec={spec} value={value} onChange={set} />
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            {resetToDesktop}
          </div>
        );
      })}
    </div>
  );
}
