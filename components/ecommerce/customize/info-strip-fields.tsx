"use client";
// coding-standard: maintained

import { Input } from "@/ui/components/input";
import { SegmentedField } from "@/ui/components/segmented-field";
import {
  PartField,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";
import type { UtilityBarDraft } from "@/components/ecommerce/customize/use-customize-draft";
import type { StorefrontSettings } from "@/types";

type Visibility = "all" | "desktop" | "mobile";

/**
 * Total because the draft is a `ResolvedUtilityBar`: `resolveUtilityBar` folds
 * away the off-on-both pair an API write can otherwise store, so the remaining
 * three cases are the only ones that reach the control.
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

/**
 * The info strip — the slim line above the header (`nav.utilityBar`; "Utility
 * bar" in the rail until 2026-09-29). It lives under Header → Computer because
 * a computer is where it shows by default, and it is part of the header a
 * merchant is looking at.
 *
 * The language and light/dark items are worded as a MOVE, because that is
 * what they do: switched off here, the header draws those controls itself
 * (`headerNeeds`), so a shopper always has exactly one of each. The old labels
 * read as show/hide, and a merchant who switched one off watched it reappear.
 */
export function InfoStripFields({
  settings,
  value,
  onChange,
}: {
  settings: StorefrontSettings;
  value: UtilityBarDraft;
  onChange: (next: UtilityBarDraft) => void;
}) {
  const update = (next: Partial<UtilityBarDraft>) => onChange({ ...value, ...next });
  const hasItem =
    value.showPhone || value.showTrackOrder || value.showLanguage || value.showTheme;

  return (
    <div className="space-y-3">
      {/* A `PartSwitch`, like every other on/off row: a sentence-case title
          here stood out against the uppercase labels of the blocks around it. */}
      <PartSwitch
        label="Info strip"
        detail="A slim line above the header"
        ariaLabel="Show the info strip"
        checked={value.enabled}
        onCheckedChange={(enabled) => update({ enabled })}
      />

      {value.enabled ? (
        <>
          <PartField label="Shown on">
            <SegmentedField
              label="Shown on"
              caption={false}
              value={visibilityOf(value)}
              onChange={(v) => update(visibilityPatch(v as Visibility))}
              options={[
                { value: "all", label: "Computer + phone" },
                { value: "desktop", label: "Computer" },
                { value: "mobile", label: "Phone" },
              ]}
            />
          </PartField>

          <div className="grid gap-2 rounded-lg border bg-background p-3">
            <PartSwitch
              label="Phone number"
              ariaLabel="Show your phone number in the info strip"
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
              ariaLabel="Show the track order link in the info strip"
              checked={value.showTrackOrder}
              onCheckedChange={(showTrackOrder) => update({ showTrackOrder })}
            />
            <PartSwitch
              label="Language switch here"
              detail="Off: it stays in the header"
              ariaLabel="Move the language switch into the info strip"
              checked={value.showLanguage}
              onCheckedChange={(showLanguage) => update({ showLanguage })}
            />
            <PartSwitch
              label="Light / dark switch here"
              detail="Off: it stays in the header"
              ariaLabel="Move the light / dark switch into the info strip"
              checked={value.showTheme}
              onCheckedChange={(showTheme) => update({ showTheme })}
            />
          </div>
          {!hasItem ? (
            <PartHint tone="warn">
              Every item is off, so the info strip will not appear.
            </PartHint>
          ) : null}

          {value.showTrackOrder ? (
            <PartField
              label="Track order label"
              hint="Leave blank to use the shopper's language automatically."
            >
              <Input
                value={value.trackOrderLabel}
                onChange={(event) => update({ trackOrderLabel: event.target.value })}
                maxLength={60}
                placeholder="Track order"
                className="h-8"
              />
            </PartField>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
