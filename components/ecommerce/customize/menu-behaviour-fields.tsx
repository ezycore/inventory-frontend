"use client";
// coding-standard: maintained

import {
  MENU_CHIPS,
  MENU_DROPDOWNS,
  MENU_MOBILE_LAYOUTS,
  MENU_OPEN_GROUPS,
  MENU_OPEN_ON,
  MENU_OVERFLOW,
  MENU_RAIL_OPEN,
  type MenuOption,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import {
  PartBlock,
  PartField,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";

type Phone = ResolvedMenuSettings["mobile"];
type Desktop = ResolvedMenuSettings["desktop"];

const segments = <T extends string>(options: readonly MenuOption<T>[]) =>
  options.map((o) => ({ value: o.id, label: o.label, description: o.description }));

/**
 * A setting from the menu registry. Ids are only ever the registry's own, so
 * the narrowing cast is safe; the registry's resolver is the authority anyway.
 */
function Choice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly MenuOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <PartField label={label} hint={hint}>
      {options.length > 3 ? (
        <SimpleSelect
          value={value}
          onValueChange={(v) => onChange(v as T)}
          options={segments(options)}
          className="h-8"
        />
      ) : (
        <SegmentedField
          label={label}
          value={value}
          onChange={(v) => onChange(v as T)}
          options={segments(options)}
        />
      )}
    </PartField>
  );
}

/** How the menu opens on a phone — the panel behind the Menu button or tab. */
export function PhoneMenuFields({
  value,
  onChange,
  hasChipsRow,
}: {
  value: Phone;
  onChange: (patch: Partial<Phone>) => void;
  /** Whether the Phone bar shows the category strip at all. */
  hasChipsRow: boolean;
}) {
  const folds = value.layout === "accordion";
  return (
    <PartBlock label="On a phone">
      <Choice
        label="Categories with sub-categories"
        value={value.layout}
        options={MENU_MOBILE_LAYOUTS}
        onChange={(layout) => onChange({ layout })}
      />
      {folds ? (
        <Choice
          label="Open when the menu opens"
          value={value.open}
          options={MENU_OPEN_GROUPS}
          onChange={(open) => onChange({ open })}
        />
      ) : null}
      {value.layout !== "expanded" ? (
        <PartSwitch
          label={'An "All ‹category›" row'}
          detail="First in each group — the category's own page"
          checked={value.viewAll}
          onCheckedChange={(viewAll) => onChange({ viewAll })}
        />
      ) : null}
      <PartSwitch
        label="Category pictures"
        detail="Beside each category, when it has one"
        checked={value.images}
        onCheckedChange={(images) => onChange({ images })}
      />
      {hasChipsRow ? (
        <Choice
          label="Category strip"
          value={value.chips}
          options={MENU_CHIPS}
          onChange={(chips) => onChange({ chips })}
        />
      ) : (
        <PartHint>
          The Phone bar can also show your categories as a scrolling strip — choose
          the Category strip layout there.
        </PartHint>
      )}
    </PartBlock>
  );
}

/** How the menu opens on a computer — the header row and the category sidebar. */
export function DesktopMenuFields({
  value,
  onChange,
  headerHasRow,
  headerCanAddRow,
  hasSidebar,
}: {
  value: Desktop;
  onChange: (patch: Partial<Desktop>) => void;
  /** The chosen header layout draws a menu row (or the merchant added one). */
  headerHasRow: boolean;
  /** The layout has no row of its own but can take one (`search-first`, `clinical`). */
  headerCanAddRow: boolean;
  /** Page layout is the category sidebar. */
  hasSidebar: boolean;
}) {
  return (
    <PartBlock label="On a computer">
      {headerCanAddRow ? (
        <PartSwitch
          label="Show a menu row"
          detail="This header layout has none — search does the finding"
          checked={value.row}
          onCheckedChange={(row) => onChange({ row })}
        />
      ) : null}
      {headerHasRow ? (
        <>
          <Choice
            label="Dropdown"
            value={value.dropdown}
            options={MENU_DROPDOWNS}
            onChange={(dropdown) => onChange({ dropdown })}
          />
          <Choice
            label="Opens on"
            hint="Touch screens always open it with a tap."
            value={value.openOn}
            options={MENU_OPEN_ON}
            onChange={(openOn) => onChange({ openOn })}
          />
          <Choice
            label="Too many links"
            value={value.overflow}
            options={MENU_OVERFLOW}
            onChange={(overflow) => onChange({ overflow })}
          />
        </>
      ) : (
        <PartHint>
          Your header layout has no menu row, so these links show on phones only.
        </PartHint>
      )}
      {hasSidebar ? (
        <Choice
          label="Category sidebar"
          hint="The sidebar always lists your categories, whatever the menu links are."
          value={value.railOpen}
          options={MENU_RAIL_OPEN}
          onChange={(railOpen) => onChange({ railOpen })}
        />
      ) : (
        <PartHint>
          Want your categories down the left of every page? Choose Category sidebar
          under Page layout.
        </PartHint>
      )}
    </PartBlock>
  );
}
