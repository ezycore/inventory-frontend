"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useUpdateStorefrontMedia } from "@/services/api";
import { RECOMMENDED } from "@/lib/image-ratio";
import { logoImageUrl } from "@/lib/storefront-image";
import {
  MOBILE_ACTIONS,
  type MobileActionId,
  type MobileChrome,
} from "@/lib/storefront-mobile";
import type { StorefrontSettings } from "@/types";
import { NumberField } from "@/ui/components/number-field";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import { PartField, PartHint } from "@/components/ecommerce/customize/part-group";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import { MobileIconField } from "@/components/ecommerce/customize/mobile-slot-field";

/**
 * The phone bar's finer settings — its own logo, the logo's size, whether it
 * follows the page, and the glyphs — folded shut under Header → Phone.
 *
 * Folded because nearly every merchant leaves them alone, and open they made
 * the phone panel two screens tall above the settings everyone does change.
 */
export function PhoneBarExtras({
  settings,
  chrome,
  patchMobile,
}: {
  settings: StorefrontSettings;
  chrome: MobileChrome;
  patchMobile: (p: Partial<MobileChrome>) => void;
}) {
  const [open, setOpen] = useState(false);
  const media = useUpdateStorefrontMedia();
  const logoInput = useRef<HTMLInputElement>(null);

  // Through `logoImageUrl`, never the thumbnail: that variant is a 200×200
  // centre crop, so a wide wordmark previewed here reads as a slice of its own
  // middle while the phone bar itself draws it whole.
  const logoUrl = logoImageUrl(settings.mobileLogo);

  const uploadLogo = (file: File) => {
    const fd = new FormData();
    fd.append("mobileLogo", file);
    media.mutate(fd);
  };
  const removeLogo = () => {
    const fd = new FormData();
    fd.append("removeMobileLogo", "true");
    media.mutate(fd);
  };

  // Every action the chrome actually draws — the glyph picker offers rows only
  // for these, so a merchant is never shown a control for a button they lack.
  const placed: MobileActionId[] = [...chrome.left, ...chrome.right, ...chrome.tabs];
  const hasIconChoices = MOBILE_ACTIONS.some(
    (a) => placed.includes(a.id) && a.icons.length > 1,
  );

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">More phone settings</span>
          <span className="block truncate text-xs text-muted-foreground">
            Phone logo · logo size · bar follows the page · icons
          </span>
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 flex-none text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>

      {open ? (
        <div className="space-y-4">
          <PartField
            label="Phone logo"
            hint="Optional. Your main logo is used when this is empty — set one if a wide wordmark is unreadable at phone size."
          >
            <MediaField
              label="Phone logo"
              url={logoUrl}
              inputRef={logoInput}
              disabled={media.isPending}
              busy={media.isPending}
              onPick={uploadLogo}
              onRemove={settings.mobileLogo ? removeLogo : undefined}
              hint="A square mark works best — the phone bar shows it small."
              recommended={RECOMMENDED.storeLogo}
            />
            <PartHint>Uploads save immediately, like your other images.</PartHint>
          </PartField>

          <PartField label="Logo height" hint="Pixels tall in the phone bar.">
            <NumberField
              value={chrome.logoHeight}
              onChange={(v) => patchMobile({ logoHeight: v ?? 34 })}
              min={18}
              max={60}
              precision={0}
              showSteppers
            />
          </PartField>

          <PartField label="Bar follows the page" hint="Stays on screen while scrolling.">
            <Switch
              checked={chrome.sticky}
              onCheckedChange={(sticky) => patchMobile({ sticky })}
              aria-label="Keep the bar on screen while scrolling"
            />
          </PartField>

          {/* Guarded with its label: a heading over a field that renders
              nothing is a merchant looking for a control that is not there. */}
          {hasIconChoices ? (
            <PartField label="Icons" hint="Only the buttons your bar actually shows are listed.">
              <MobileIconField
                placed={placed}
                icons={chrome.icons}
                onChange={(icons) => patchMobile({ icons })}
              />
            </PartField>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
