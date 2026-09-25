"use client";
// coding-standard: maintained

import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Header — the desktop bar's layout.
 *
 * WHAT is in the menu, how it opens (2026-09-24) and how its links react to a
 * pointer (2026-09-25) moved to the Menu part: it drives the phone panel, the
 * phone chips row and the category sidebar as much as this bar, and a merchant
 * looking for their menu looks for the word "Menu".
 */
export function HeaderPart({
  draft,
  patchTemplate,
}: Pick<CustomizeDraftApi, "draft" | "patchTemplate">) {
  return (
    <PartBlock label="Layout">
      <TemplatePicker
        templateKey="header"
        value={draft.templates.header}
        onChange={(v) => patchTemplate("header", v)}
      />
      <PartHint>
        The menu&apos;s links, how they open and how they react on hover are under Menu.
      </PartHint>
    </PartBlock>
  );
}
