"use client";
// coding-standard: maintained

import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { PartHint, PartLabel } from "@/components/ecommerce/customize/part-group";
import { isStripHiddenEverywhere } from "@/lib/storefront-strip-display";

/**
 * The shared per-breakpoint visibility pair used by storefront elements.
 *
 * Shared rather than copied because the warning below it is the part that would
 * rot: two switches with no cross-validation make "off everywhere" reachable in
 * one click, and a strip that is *configured, enabled and invisible* reads as a
 * bug in the product rather than a choice the merchant made. Saying so at the
 * point of the mistake is the whole value, and it has to say the same thing in
 * every editor.
 */
export function ResponsiveVisibilityField({
  showOnDesktop,
  showOnMobile,
  onChange,
  what,
}: {
  showOnDesktop: boolean;
  showOnMobile: boolean;
  onChange: (patch: { showOnDesktop?: boolean; showOnMobile?: boolean }) => void;
  /** Name of the thing, for the warning copy ("bar" / "strip"). */
  what: string;
}) {
  const hiddenEverywhere = isStripHiddenEverywhere(showOnDesktop, showOnMobile);
  return (
    <div className="space-y-1.5">
      <PartLabel>Show on</PartLabel>
      <div className="grid gap-2 rounded-lg border p-3">
        <label className="flex items-center justify-between gap-3">
          <Label className="cursor-pointer font-normal">Desktop</Label>
          <Switch
            checked={showOnDesktop}
            onCheckedChange={(v) => onChange({ showOnDesktop: v })}
            aria-label={`Show the ${what} on desktop`}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <Label className="cursor-pointer font-normal">Mobile</Label>
          <Switch
            checked={showOnMobile}
            onCheckedChange={(v) => onChange({ showOnMobile: v })}
            aria-label={`Show the ${what} on mobile`}
          />
        </label>
      </div>
      {hiddenEverywhere ? (
        <PartHint tone="warn">
          Both are off, so the {what} will not appear anywhere.
        </PartHint>
      ) : null}
    </div>
  );
}
