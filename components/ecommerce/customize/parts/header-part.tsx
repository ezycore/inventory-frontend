"use client";
// coding-standard: maintained

import { DESIGN_NAV_HOVERS, type StoreDesign } from "@/lib/storefront-theme";
import { SegmentedField } from "@/ui/components/segmented-field";
import {
  PartBlock,
  PartField,
  PartHint,
} from "@/components/ecommerce/customize/part-group";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Header — the desktop bar's layout and how its menu links react to a pointer.
 *
 * WHAT is in the menu, and how it opens, moved to its own Menu part
 * (2026-09-24): it drives the phone panel, the phone chips row and the category
 * sidebar as much as this bar, and a merchant looking for their menu looks for
 * the word "Menu".
 */
export function HeaderPart({
  draft,
  patch,
  patchTemplate,
}: Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
  /* The hover settings are `design` axes — the same object Look edits — but
     they are edited HERE rather than under Look for one reason: a merchant
     wonders what their menu does when it is pointed at while they are looking
     at the header. Same `patch`, same object — only the panel differs. */
  const setDesign = (axis: Partial<StoreDesign>) =>
    patch({ design: { ...draft.design, ...axis } });

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="header"
          value={draft.templates.header}
          onChange={(v) => patchTemplate("header", v)}
        />
        <PartHint>The menu&apos;s links, and how they open on a phone and here, are under Menu.</PartHint>
      </PartBlock>

      <PartBlock
        label="Hover"
        hint="What a menu link does when a visitor points at it. Nothing happens by default — and on a phone nothing happens either way, where the menu is a panel and a tap opens it."
      >
        <PartField
          label="Menu items"
          hint="The row across your header — a department, or a link you added."
        >
          <SegmentedField
            label="Menu items"
            value={draft.design.navHover}
            onChange={(navHover) => setDesign({ navHover })}
            options={DESIGN_NAV_HOVERS.map((o) => ({
              value: o.id,
              label: o.label,
              description: o.description,
            }))}
          />
        </PartField>
        <PartField
          label="Dropdown items"
          hint="The sub-categories and links that open underneath one."
        >
          <SegmentedField
            label="Dropdown items"
            value={draft.design.navChildHover}
            onChange={(navChildHover) => setDesign({ navChildHover })}
            options={DESIGN_NAV_HOVERS.map((o) => ({
              value: o.id,
              label: o.label,
              description: o.description,
            }))}
          />
        </PartField>
      </PartBlock>
    </>
  );
}
