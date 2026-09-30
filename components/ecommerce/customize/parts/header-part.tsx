"use client";
// coding-standard: maintained

import { Monitor, Smartphone } from "lucide-react";
import type { StorefrontSettings } from "@/types";
import { SegmentedField } from "@/ui/components/segmented-field";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { ComputerHeaderFields } from "@/components/ecommerce/customize/parts/header-computer";
import { PhoneHeaderFields } from "@/components/ecommerce/customize/parts/header-phone";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

export type PreviewDevice = "mobile" | "desktop";

/**
 * Header — the top of the shop on each screen, behind one Phone / Computer
 * switch that also turns the preview.
 *
 * It was four rows until 2026-09-29: Header (the computer layout, though
 * nothing said so), Phone bar three rows down, Utility bar between them, and
 * the half of Menu that decided how the menu opens. A merchant changing "my
 * header" had to know that split. Now the rows are Header (how it looks, per
 * device) and Menu (what is in it), and the device is a switch, not a row.
 *
 * The device is the workspace's, not this panel's: the preview has to turn with
 * it, and a `?part=utility` link opens straight onto Computer.
 */
export function HeaderPart({
  settings,
  device,
  onDevice,
  ...api
}: {
  settings: StorefrontSettings;
  device: PreviewDevice;
  onDevice: (device: PreviewDevice) => void;
} & Pick<
  CustomizeDraftApi,
  "draft" | "patch" | "patchTemplate" | "patchMobile" | "patchMobileTemplate"
>) {
  return (
    <>
      <div className="space-y-2">
        <SegmentedField
          label="Edit the header for"
          caption={false}
          value={device}
          onChange={(v) => onDevice(v === "desktop" ? "desktop" : "mobile")}
          options={[
            { value: "mobile", label: "Phone", glyph: <Smartphone className="h-4 w-4" /> },
            { value: "desktop", label: "Computer", glyph: <Monitor className="h-4 w-4" /> },
          ]}
        />
        <PartHint>
          The preview switches with it. The menu&apos;s links are under Menu.
        </PartHint>
      </div>

      {device === "mobile" ? (
        <PhoneHeaderFields
          settings={settings}
          draft={api.draft}
          patch={api.patch}
          patchMobile={api.patchMobile}
          patchMobileTemplate={api.patchMobileTemplate}
        />
      ) : (
        <ComputerHeaderFields
          settings={settings}
          draft={api.draft}
          patch={api.patch}
          patchTemplate={api.patchTemplate}
        />
      )}
    </>
  );
}
