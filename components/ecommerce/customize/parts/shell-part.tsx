"use client";
// coding-standard: maintained

import { MENU_RAIL_OPEN } from "@/lib/storefront-menu";
import { Choice } from "@/components/ecommerce/customize/menu-behaviour-fields";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Page layout — the frame every page sits in, and, when that frame is the
 * category sidebar, how the sidebar opens.
 *
 * The sidebar setting was under Menu → Computer until 2026-09-29, behind a hint
 * sending the merchant here to switch the sidebar on. It is the same thing the
 * picker above it chooses, so it is answered in the same place.
 */
export function ShellPart({
  draft,
  patch,
  patchTemplate,
}: Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
  const menu = draft.navMenu;
  return (
    <>
      <TemplatePicker
        templateKey="shell"
        value={draft.templates.shell}
        onChange={(v) => patchTemplate("shell", v)}
        columns={2}
      />
      {draft.templates.shell === "rail" ? (
        <Choice
          label="Category sidebar"
          hint="The sidebar always lists your categories, whatever the menu links are."
          value={menu.desktop.railOpen}
          options={MENU_RAIL_OPEN}
          onChange={(railOpen) =>
            patch({ navMenu: { ...menu, desktop: { ...menu.desktop, railOpen } } })
          }
        />
      ) : null}
    </>
  );
}
