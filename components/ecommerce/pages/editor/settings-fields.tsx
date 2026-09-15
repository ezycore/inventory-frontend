"use client";
// coding-standard: maintained

import { Smartphone } from "lucide-react";
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import type { StoreFocalPoint } from "@/lib/storefront-focal";
import { Label } from "@/ui/components/label";
import { FocalPointPicker } from "@/components/ecommerce/customize/focal-point-picker";
import { FieldControl } from "./field-control";
import { ImageField } from "./image-field";
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
 * a picture to point at.
 */
export function SettingsFields({
  idPrefix,
  specs,
  settings,
  device,
  onChange,
}: {
  idPrefix: string;
  specs: Record<string, SectionFieldSpec>;
  settings: Record<string, unknown>;
  device: EditorDevice;
  onChange: (settings: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(specs).map(([key, spec]) => {
        const id = `${idPrefix}-${key}`;
        const label = fieldLabel(key);
        const hint = fieldHint(key);
        const value = fieldValue(settings, key, spec, device);
        const set = (next: unknown) => onChange(withFieldValue(settings, key, spec, next, device));
        const ownPhoneValue = hasPhoneValue(settings, key, spec);

        const phoneNote = spec.responsive ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3" aria-hidden />
            {device === "mobile" ? (ownPhoneValue ? "Phone value" : "Same as desktop") : "Can differ on phones"}
          </span>
        ) : null;
        const resetToDesktop =
          device === "mobile" && ownPhoneValue ? (
            <button type="button" onClick={() => set(undefined)} className="text-xs font-medium text-primary hover:underline">
              Reset to desktop
            </button>
          ) : null;

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
            <FieldControl id={id} name={key} spec={spec} value={value} onChange={set} />
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            {resetToDesktop}
          </div>
        );
      })}
    </div>
  );
}
