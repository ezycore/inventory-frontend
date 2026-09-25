"use client";
// coding-standard: maintained

import { DESIGN_NAV_HOVERS, type StoreDesign } from "@/lib/storefront-theme";
import { SegmentedField } from "@/ui/components/segmented-field";
import { PartBlock, PartField } from "@/components/ecommerce/customize/part-group";

const HOVER_OPTIONS = DESIGN_NAV_HOVERS.map((o) => ({
  value: o.id,
  label: o.label,
  description: o.description,
}));

/**
 * How a menu link reacts to a pointer — computer only, since a phone's menu is
 * a panel a tap opens. These are `design` axes (the object Look edits, so the
 * save bar counts them under Look), edited under Menu because that is where a
 * merchant looks for what their menu does. Moved here from Header 2026-09-25.
 */
export function MenuHoverFields({
  design,
  onChange,
}: {
  design: StoreDesign;
  onChange: (axis: Partial<StoreDesign>) => void;
}) {
  return (
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
          value={design.navHover}
          onChange={(navHover) => onChange({ navHover })}
          options={HOVER_OPTIONS}
        />
      </PartField>
      <PartField
        label="Dropdown items"
        hint="The sub-categories and links that open underneath one."
      >
        <SegmentedField
          label="Dropdown items"
          value={design.navChildHover}
          onChange={(navChildHover) => onChange({ navChildHover })}
          options={HOVER_OPTIONS}
        />
      </PartField>
    </PartBlock>
  );
}
