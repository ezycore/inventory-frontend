"use client";
// coding-standard: maintained

import type { StorefrontSettings } from "@/types";
import { PartBlock, PartSwitch } from "@/components/ecommerce/customize/part-group";
import { DesktopMenuRowFields } from "@/components/ecommerce/customize/menu-behaviour-fields";
import { MenuHoverFields } from "@/components/ecommerce/customize/menu-hover-fields";
import { InfoStripFields } from "@/components/ecommerce/customize/info-strip-fields";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/** Header layouts with no menu row of their own, which can take one on request. */
const ROWLESS_HEADERS = new Set(["search-first", "clinical"]);

/**
 * Header → Computer: the layout, the info strip above it, and the menu row in
 * it — how that row opens and how its links react to a pointer.
 *
 * The info strip was the Utility bar row and the menu row's settings were Menu →
 * Computer until 2026-09-29; both are part of the header a merchant is looking
 * at, so they are edited under it.
 */
export function ComputerHeaderFields({
  settings,
  draft,
  patch,
  patchTemplate,
}: { settings: StorefrontSettings } & Pick<
  CustomizeDraftApi,
  "draft" | "patch" | "patchTemplate"
>) {
  const menu = draft.navMenu;
  const header = draft.templates.header;
  const rowless = ROWLESS_HEADERS.has(header);

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="header"
          value={header}
          onChange={(v) => patchTemplate("header", v)}
        />
      </PartBlock>

      <InfoStripFields
        settings={settings}
        value={draft.utilityBar}
        onChange={(utilityBar) => patch({ utilityBar })}
      />

      <PartBlock label="Menu row">
        <DesktopMenuRowFields
          value={menu.desktop}
          onChange={(p) => patch({ navMenu: { ...menu, desktop: { ...menu.desktop, ...p } } })}
          headerHasRow={!rowless || menu.desktop.row}
          headerCanAddRow={rowless}
        />
      </PartBlock>

      {/* `design` axes, so the save bar counts them under Look. */}
      <MenuHoverFields
        design={draft.design}
        onChange={(axis) => patch({ design: { ...draft.design, ...axis } })}
      />

      <PartSwitch
        label="Header follows the page"
        detail="Stays on screen while shoppers scroll"
        checked={draft.desktopHeader.sticky}
        onCheckedChange={(sticky) => patch({ desktopHeader: { sticky } })}
      />
    </>
  );
}
