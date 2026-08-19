"use client";
// coding-standard: maintained

import { useRef } from "react";
import { useUpdateStorefrontMedia } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import { BrandColorsField } from "@/components/ecommerce/customize/brand-colors-field";
import { LogoStyleField } from "@/components/ecommerce/customize/logo-style-field";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import { PresetTiles } from "@/components/ecommerce/customize/preset-tiles";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { getPreset } from "@/lib/storefront-theme";
import { RECOMMENDED } from "@/lib/image-ratio";

/**
 * Brand — the preset, the two colours and the logo. It sits above the store
 * parts rather than among them because it is the only group that changes every
 * other one.
 *
 * The logo is the exception to the page's single Save: media persists through
 * its own multipart PATCH the moment it is picked, which the hint says plainly.
 */
export function BrandPart({
  settings,
  draft,
  patch,
}: {
  settings: StorefrontSettings;
} & Pick<CustomizeDraftApi, "draft" | "patch">) {
  const media = useUpdateStorefrontMedia();
  // The shop inherits the organization logo unless a store-specific one is
  // uploaded (the public payload falls back server-side the same way).
  const orgLogo = useAuthStore((s) => s.user?.organization?.logo);
  const logoInput = useRef<HTMLInputElement>(null);
  // The mark actually on the shop right now — the store's own, else the
  // organization's, matching what the public payload resolves to.
  const logoUrl =
    settings.logo?.thumbnailUrl ||
    settings.logo?.url ||
    orgLogo?.thumbnailUrl ||
    orgLogo?.url;

  const pickPreset = (id: string) => {
    const def = getPreset(id);
    patch({ preset: id, brandColor: def.brandColor, accentColor: def.accentColor });
  };

  const uploadLogo = (file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    media.mutate(fd);
  };
  const removeLogo = () => {
    const fd = new FormData();
    fd.append("removeLogo", "true");
    media.mutate(fd);
  };

  return (
    <>
      <PartBlock
        label="Preset"
        hint="Pick a starting point, then fine-tune the colours below."
      >
        <PresetTiles preset={draft.preset} onPick={pickPreset} />
      </PartBlock>

      <PartBlock label="Colours">
        <BrandColorsField
          brandColor={draft.brandColor}
          accentColor={draft.accentColor}
          setBrandColor={(brandColor) => patch({ brandColor })}
          setAccentColor={(accentColor) => patch({ accentColor })}
        />
      </PartBlock>

      <PartBlock label="Logo">
        <MediaField
          label="Logo"
          url={logoUrl}
          inputRef={logoInput}
          disabled={media.isPending}
          busy={media.isPending}
          onPick={uploadLogo}
          onRemove={settings.logo ? removeLogo : undefined}
          hint="600 × 200 px (up to 3:1) works best — the header shows it at 42px tall by default."
          recommended={RECOMMENDED.storeLogo}
        />
        <PartHint>
          {settings.logo
            ? "Uploads save immediately. Remove it to fall back to your organization logo."
            : orgLogo
              ? "Currently showing your organization logo. Uploading here overrides it for the store only, and saves immediately."
              : "Uploads save immediately. Set an organization logo instead to use one mark everywhere."}
        </PartHint>
      </PartBlock>

      {/* Chrome, not media — these ride the page's single Save, unlike the file
          above. Only worth showing once there is a logo to apply them to. */}
      {logoUrl ? (
        <PartBlock
          label="Logo display"
          hint="A logo drawn in one flat colour disappears on the shop theme that matches it — black type on the dark theme, white type on the light one. A backdrop fixes both at once."
        >
          <LogoStyleField
            value={draft.logoStyle}
            onChange={(logoStyle) => patch({ logoStyle })}
            logoUrl={logoUrl}
          />
        </PartBlock>
      ) : null}
    </>
  );
}
