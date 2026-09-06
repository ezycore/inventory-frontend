"use client";
// coding-standard: maintained

import { useRef } from "react";
import { useUpdateStorefrontMedia } from "@/services/api";
import { RECOMMENDED } from "@/lib/image-ratio";
import {
  MAX_MOBILE_TABS,
  MOBILE_ACTIONS,
  MOBILE_TAB_IDS,
  canBrowse,
  mobileTemplate,
  type MobileActionId,
  type MobileTabId,
} from "@/lib/storefront-mobile";
import type { StorefrontSettings } from "@/types";
import { SegmentedField } from "@/ui/components/segmented-field";
import {
  PartBlock,
  PartField,
  PartHint,
} from "@/components/ecommerce/customize/part-group";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import { MobileArrangementFields } from "@/components/ecommerce/customize/mobile-arrangement-fields";
import {
  MobileIconField,
  MobileSlotField,
} from "@/components/ecommerce/customize/mobile-slot-field";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Phone — the chrome a shopper sees at the top and bottom of the shop on their
 * own device, which for this platform's merchants is nearly all of their
 * traffic.
 *
 * **A template, then the arrangement over it.** The picker is the whole
 * decision for most merchants; everything under it is for the one who wants
 * their cart on the left or their hamburger drawn differently. Switching
 * template RESETS the arrangement (`patchMobileTemplate`), so the shop a
 * merchant gets is the one the tile showed them — the panel says so rather than
 * leaving them to discover it.
 *
 * The live preview beside this is a real 390px frame, so every control here
 * repaints the actual bar as it is changed. That is why there is no wireframe
 * of the arrangement in the panel: there is a real one two inches to the right.
 */
export function MobilePart({
  settings,
  draft,
  patchMobile,
  patchMobileTemplate,
}: {
  settings: StorefrontSettings;
} & Pick<CustomizeDraftApi, "draft" | "patchMobile" | "patchMobileTemplate">) {
  const media = useUpdateStorefrontMedia();
  const logoInput = useRef<HTMLInputElement>(null);
  const m = draft.mobile;
  const template = mobileTemplate(draft.templates.mobile);

  const logoUrl = settings.mobileLogo?.thumbnailUrl || settings.mobileLogo?.url;

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

  // Every action the chrome actually draws right now — what the glyph picker
  // offers rows for, so a merchant is never shown a control for a button their
  // bar does not have.
  const placed: MobileActionId[] = [...m.left, ...m.right, ...m.tabs];

  // A `call` button with no published number renders nothing on the live shop,
  // so the row says that here instead of leaving the merchant to find out on
  // their phone. The number lives in Settings → General, not in this draft.
  const noPhone = !settings.contact?.phone?.trim();
  const disabledIds = noPhone ? { call: "— no phone number saved" } : undefined;

  const barActions = MOBILE_ACTIONS.map((a) => a.id);
  const hasIconChoices = MOBILE_ACTIONS.some(
    (a) => placed.includes(a.id) && a.icons.length > 1,
  );

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="mobile"
          value={template.id}
          onChange={patchMobileTemplate}
          columns={3}
        />
        <PartHint>
          Picking a layout resets the arrangement below to that layout&apos;s own.
        </PartHint>
      </PartBlock>

      <PartBlock
        label="Phone logo"
        hint="Optional. Your main logo is used when this is empty — set one here if a wide wordmark is unreadable at phone size."
      >
        <MediaField
          label="Phone logo"
          url={logoUrl}
          inputRef={logoInput}
          disabled={media.isPending}
          busy={media.isPending}
          onPick={uploadLogo}
          onRemove={settings.mobileLogo ? removeLogo : undefined}
          hint="A square mark works best — the phone bar shows it small and centred on most layouts."
          recommended={RECOMMENDED.storeLogo}
        />
        <PartHint>Uploads save immediately, like your other images.</PartHint>
      </PartBlock>

      {/* Warned, never forbidden. The merchant can empty every slot, and the
          menu panel is the only category navigation a phone has — so this is a
          shop whose shoppers can reach one page and the cart. Blocking the edit
          would be the editor overruling the owner of the shop; saying nothing
          would let them ship it without ever seeing it, since the preview's home
          page still looks perfectly fine. */}
      {!canBrowse(m) ? (
        <PartHint tone="warn">
          Nothing on this bar opens your menu, so shoppers on a phone have no way
          to browse your categories. Add <strong>Menu</strong> to a slot below.
        </PartHint>
      ) : null}

      <MobileArrangementFields
        chrome={m}
        patchMobile={patchMobile}
        barActions={barActions}
        disabledIds={disabledIds}
      />

      <PartBlock
        label="Bottom tab bar"
        hint={
          m.tabs.length
            ? "Shown on every page, pinned above the keyboard-safe area."
            : "No tabs — this layout navigates from the top bar only."
        }
      >
        <MobileSlotField
          value={m.tabs}
          onChange={(tabs) => patchMobile({ tabs: tabs as MobileTabId[] })}
          allow={MOBILE_TAB_IDS}
          max={MAX_MOBILE_TABS}
          disabledIds={disabledIds}
          emptyLabel="No bottom bar on this layout."
        />
      </PartBlock>

      <PartBlock label="Menu opens as">
        <SegmentedField
          label="Menu opens as"
          value={m.menuStyle}
          onChange={(menuStyle) =>
            patchMobile({ menuStyle: menuStyle as "drawer" | "sheet" })
          }
          options={[
            { value: "drawer", label: "Side drawer", description: "Slides in from the left" },
            { value: "sheet", label: "Bottom sheet", description: "Rises from the thumb" },
          ]}
        />
      </PartBlock>

      {/* The label is guarded too, not just the rows: a `PartBlock` whose child
          renders null still draws its heading, and "Icons" over empty space is
          a merchant looking for a control that is not there. */}
      {hasIconChoices ? (
        <PartBlock
          label="Icons"
          hint="Only the buttons your layout actually shows are listed."
        >
          <MobileIconField
            placed={placed}
            icons={m.icons}
            onChange={(icons) => patchMobile({ icons })}
          />
        </PartBlock>
      ) : null}
    </>
  );
}
