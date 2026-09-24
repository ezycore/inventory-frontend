"use client";
// coding-standard: maintained

import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { OptionChip } from "@/ui/components/option-card";
import {
  PartBlock,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";
import type {
  CustomizeDraftApi,
  UtilityBarDraft,
} from "@/components/ecommerce/customize/use-customize-draft";
import type { StorefrontSettings } from "@/types";

type Visibility = "all" | "desktop" | "mobile";

const VISIBILITY: { value: Visibility; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "desktop", label: "Desktop only" },
  { value: "mobile", label: "Mobile only" },
];

/**
 * Total because the draft is a `ResolvedUtilityBar`: `resolveUtilityBar` folds
 * away the off-on-both pair an API write can otherwise store, so the remaining
 * three cases are the only ones that reach a chip.
 */
const visibilityOf = (value: UtilityBarDraft): Visibility =>
  value.showOnDesktop && value.showOnMobile
    ? "all"
    : value.showOnDesktop
      ? "desktop"
      : "mobile";

const visibilityPatch = (
  value: Visibility,
): Pick<UtilityBarDraft, "showOnDesktop" | "showOnMobile"> => ({
  showOnDesktop: value !== "mobile",
  showOnMobile: value !== "desktop",
});

/** The merchant-owned information strip above the main storefront header. */
export function UtilityBarPart({
  settings,
  draft,
  patch,
}: Pick<CustomizeDraftApi, "draft" | "patch"> & {
  settings: StorefrontSettings;
}) {
  const value = draft.utilityBar;
  const update = (next: Partial<UtilityBarDraft>) =>
    patch({ utilityBar: { ...value, ...next } });

  if (!value.enabled) {
    return (
      <PartHint>
        Turn this on to add a slim information bar above the header.
      </PartHint>
    );
  }

  const hasItem =
    value.showPhone ||
    value.showTrackOrder ||
    value.showLanguage ||
    value.showTheme;

  return (
    <div className="grid gap-4">
      <PartBlock label="Show on">
        <div className="flex flex-wrap gap-2">
          {VISIBILITY.map((option) => (
            <OptionChip
              key={option.value}
              selected={visibilityOf(value) === option.value}
              onSelect={() => update(visibilityPatch(option.value))}
            >
              {option.label}
            </OptionChip>
          ))}
        </div>
      </PartBlock>

      <PartBlock
        label="Information"
        hint="Choose the controls shoppers see in this bar."
      >
        <div className="grid gap-2 rounded-lg border p-3">
          <PartSwitch
            label="Phone number"
            ariaLabel="Show phone number in the utility bar"
            detail={
              settings.contact?.phone?.trim()
                ? settings.contact.phone
                : "No phone saved under Store Settings → General"
            }
            checked={value.showPhone}
            onCheckedChange={(showPhone) => update({ showPhone })}
          />
          <PartSwitch
            label="Track order"
            ariaLabel="Show track order in the utility bar"
            checked={value.showTrackOrder}
            onCheckedChange={(showTrackOrder) => update({ showTrackOrder })}
          />
          <PartSwitch
            label="Language"
            ariaLabel="Show language in the utility bar"
            checked={value.showLanguage}
            onCheckedChange={(showLanguage) => update({ showLanguage })}
          />
          <PartSwitch
            label="Light / dark theme"
            ariaLabel="Show light / dark theme in the utility bar"
            checked={value.showTheme}
            onCheckedChange={(showTheme) => update({ showTheme })}
          />
        </div>
        {!hasItem ? (
          <PartHint tone="warn">
            Every item is off, so the utility bar will not appear.
          </PartHint>
        ) : null}
      </PartBlock>

      {value.showTrackOrder ? (
        <div className="space-y-1.5">
          <Label>Track order label</Label>
          <Input
            value={value.trackOrderLabel}
            onChange={(event) => update({ trackOrderLabel: event.target.value })}
            maxLength={60}
            placeholder="Track order"
          />
          <PartHint>
            Leave blank to use the shopper&apos;s language automatically.
          </PartHint>
        </div>
      ) : null}
    </div>
  );
}
