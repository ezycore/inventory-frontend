"use client";
// coding-standard: maintained

import {
  DESIGN_NAV_ACTIVE_COLORS,
  DESIGN_NAV_ACTIVES,
  DESIGN_NAV_HOVERS,
  type DesignOption,
  type StoreDesign,
} from "@/lib/storefront-theme";
import { ColorField } from "@/ui/components/color-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { PartBlock, PartField } from "@/components/ecommerce/customize/part-group";

const options = (list: DesignOption[]) =>
  list.map((o) => ({ value: o.id, label: o.label, description: o.description }));

const HOVER_OPTIONS = options(DESIGN_NAV_HOVERS);

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

/**
 * How every menu marks the page the shopper is on — the phone menu, the
 * collection page's sub-category row, the header row and its dropdowns, and
 * the category sidebar. `design` axes like hover, so the save bar counts them
 * under Look; drawn above the device switch because one answer serves both.
 *
 * A preset style and a colour, never free background / text / shadow pickers:
 * the shopper's dark theme would turn a hand-picked pair unreadable, and the
 * presets take their fill from the chosen colour so they cannot fail contrast.
 */
export function MenuActiveFields({
  design,
  onChange,
}: {
  design: StoreDesign;
  onChange: (axis: Partial<StoreDesign>) => void;
}) {
  return (
    <PartBlock
      label="Current page"
      hint="How your menus mark where the shopper is — in the phone menu, the sub-category row, the header and the sidebar."
    >
      <PartField label="Style">
        <SegmentedField
          label="Style"
          value={design.navActive}
          onChange={(navActive) => onChange({ navActive })}
          options={options(DESIGN_NAV_ACTIVES)}
        />
      </PartField>
      <PartField
        label="Colour"
        hint="If your brand colour is very dark, Accent or a colour of your own stands out more."
      >
        <SegmentedField
          label="Colour"
          value={design.navActiveColor}
          onChange={(navActiveColor) => onChange({ navActiveColor })}
          options={options(DESIGN_NAV_ACTIVE_COLORS)}
        />
      </PartField>
      {design.navActiveColor === "custom" ? (
        <ColorField
          label="Your colour"
          value={design.navActiveCustom}
          onChange={(navActiveCustom) => onChange({ navActiveCustom })}
          hint="Empty uses your brand colour. Lightened automatically on the dark theme so it stays readable."
        />
      ) : null}
    </PartBlock>
  );
}
