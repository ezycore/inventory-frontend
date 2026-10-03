"use client";
// coding-standard: maintained

import { useState } from "react";
import { MENU_CHIPS } from "@/lib/storefront-menu";
import {
  MAX_MOBILE_TABS,
  MAX_SLOT_ACTIONS,
  MOBILE_ACTIONS,
  MOBILE_TAB_IDS,
  canBrowse,
  mobileSearchMode,
  mobileTemplate,
  withCategoryStrip,
  withSearchMode,
  type MobileChrome,
  type MobileSearchMode,
  type MobileTabId,
} from "@/lib/storefront-mobile";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { SegmentedField } from "@/ui/components/segmented-field";
import {
  PartBlock,
  PartField,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";
import {
  Choice,
  PhoneMenuPanelFields,
} from "@/components/ecommerce/customize/menu-behaviour-fields";
import { MobileSlotField } from "@/components/ecommerce/customize/mobile-slot-field";
import { PhoneBarExtras } from "@/components/ecommerce/customize/parts/header-phone-extras";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

const SEARCH_OPTIONS: { value: MobileSearchMode; label: string; description: string }[] = [
  { value: "none", label: "None", description: "No search on phones — fine for a small catalogue" },
  { value: "icon", label: "Icon", description: "A magnifier in the top bar that opens the search box" },
  { value: "bar", label: "In the bar", description: "A search box beside your logo, which moves left to make room" },
  { value: "under", label: "Under it", description: "A full-width search box on its own row under the bar" },
];

/**
 * Header → Phone: everything at the top and bottom of a phone screen, which for
 * this platform's merchants is nearly all of their traffic.
 *
 * It absorbed the Phone bar row and the phone half of Menu (2026-09-29): the
 * bar, the tabs under the thumb and the panel the Menu button opens are one
 * thing a shopper sees, and were three places a merchant had to look.
 *
 * **A layout, then the arrangement over it.** Picking a layout RESETS the
 * arrangement (`patchMobileTemplate`) so the shop is the one the tile showed —
 * and the panel keeps the previous arrangement for one Undo, because the reset
 * throws away slots the merchant may have spent a while placing.
 */
export function PhoneHeaderFields({
  settings,
  draft,
  patch,
  patchMobile,
  patchMobileTemplate,
}: { settings: StorefrontSettings } & Pick<
  CustomizeDraftApi,
  "draft" | "patch" | "patchMobile" | "patchMobileTemplate"
>) {
  const m = draft.mobile;
  const template = mobileTemplate(draft.templates.mobile);
  const [undo, setUndo] = useState<{ template: string; mobile: MobileChrome } | null>(null);
  const menu = draft.navMenu;

  // A `call` button with no published number renders nothing on the live shop,
  // so the row says that here instead of leaving the merchant to find out on
  // their phone. The number lives in Settings → General, not in this draft.
  const noPhone = !settings.contact?.phone?.trim();
  const disabledIds = noPhone ? { call: "— no phone number saved" } : undefined;
  const barActions = MOBILE_ACTIONS.map((a) => a.id);

  const pickTemplate = (value: string) => {
    setUndo({ template: template.id, mobile: m });
    patchMobileTemplate(value);
  };

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="mobile"
          value={template.id}
          onChange={pickTemplate}
          columns={3}
        />
        {undo ? (
          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
            <span className="min-w-0 flex-1">
              Top bar, search and tabs now match {template.label}.
            </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => {
                patch({
                  templates: { ...draft.templates, mobile: undo.template },
                  mobile: undo.mobile,
                });
                setUndo(null);
              }}
            >
              Undo
            </Button>
          </div>
        ) : (
          <PartHint>Picking a layout replaces the arrangement below with its own.</PartHint>
        )}
      </PartBlock>

      <PartBlock
        label="Top bar"
        hint="Language and Light / dark show in the bar when you place them here; leave them out and they move into the menu panel."
      >
        {/* Warned, never forbidden: the menu panel is the only category
            navigation a phone has, but it is the merchant's shop to shape. */}
        {!canBrowse(m) ? (
          <PartHint tone="warn">
            Nothing on this bar opens your menu, so shoppers on a phone cannot browse
            your categories. Add <strong>Menu</strong> to a slot or a tab.
          </PartHint>
        ) : null}
        <PartField label="Left of the logo">
          <MobileSlotField
            value={m.left}
            onChange={(left) => patchMobile({ left })}
            allow={barActions}
            max={MAX_SLOT_ACTIONS}
            disabledIds={disabledIds}
            emptyLabel="Nothing on the left."
          />
        </PartField>
        <PartField label="Right of the logo">
          <MobileSlotField
            value={m.right}
            onChange={(right) => patchMobile({ right })}
            allow={barActions}
            max={MAX_SLOT_ACTIONS}
            disabledIds={disabledIds}
            emptyLabel="Nothing on the right."
          />
        </PartField>
        <PartField label="Logo">
          <SegmentedField
            label="Logo position"
            caption={false}
            value={m.brand}
            onChange={(brand) =>
              patchMobile({
                brand: brand as "left" | "center",
                // A centred logo leaves no room beside it for a search box, so
                // the box moves to its own row rather than the segment greying out.
                ...(brand === "center" && m.searchInline
                  ? withSearchMode(m, "under")
                  : {}),
              })
            }
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Centred" },
            ]}
          />
        </PartField>
      </PartBlock>

      <PartBlock label="Search">
        <SegmentedField
          label="Search"
          value={mobileSearchMode(m)}
          onChange={(mode) => patchMobile(withSearchMode(m, mode as MobileSearchMode))}
          options={SEARCH_OPTIONS}
        />
      </PartBlock>

      <div className="space-y-3">
        <PartSwitch
          label="Categories under the bar"
          detail="A scrolling row of your collections"
          checked={m.row === "chips"}
          onCheckedChange={(on) => patchMobile(withCategoryStrip(m, on))}
        />
        {m.row === "chips" ? (
          <Choice
            label="Strip shows"
            value={menu.mobile.chips}
            options={MENU_CHIPS}
            onChange={(chips) =>
              patch({ navMenu: { ...menu, mobile: { ...menu.mobile, chips } } })
            }
          />
        ) : mobileSearchMode(m) === "under" ? (
          <PartHint>Only one row fits under the bar. Switching this on moves search up to an icon.</PartHint>
        ) : null}
      </div>

      <PartBlock
        label="Bottom tabs"
        hint={
          m.tabs.length
            ? "Shown on every page, pinned to the bottom of the screen."
            : "No tabs — shoppers get around from the top bar."
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

      <PartBlock
        label="Menu panel"
        hint="What opens when a shopper taps Menu. The links themselves are under Menu."
      >
        <PhoneMenuPanelFields
          value={menu.mobile}
          onChange={(p) => patch({ navMenu: { ...menu, mobile: { ...menu.mobile, ...p } } })}
          menuStyle={m.menuStyle}
          onMenuStyle={(menuStyle) => patchMobile({ menuStyle })}
        />
      </PartBlock>

      <PhoneBarExtras settings={settings} chrome={m} patchMobile={patchMobile} />
    </>
  );
}
