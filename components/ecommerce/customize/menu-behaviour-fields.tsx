"use client";
// coding-standard: maintained

import {
  MENU_COLLECTION_STRIPS,
  MENU_DRAWER_WIDTHS,
  MENU_DROPDOWNS,
  MENU_MOBILE_LAYOUTS,
  MENU_OPEN_GROUPS,
  MENU_OPEN_ON,
  MENU_OVERFLOW,
  MENU_TEXT_MAX,
  type MenuOption,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import type { MobileMenuStyle } from "@/lib/storefront-mobile";
import { Input } from "@/ui/components/input";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import {
  PartField,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";

/**
 * The menu settings (`nav.menu`), split by the question they answer.
 *
 * **How the menu opens is a HEADER setting; what is in it is a MENU setting**
 * (2026-09-29). The phone panel's shape sits beside the phone bar that opens it
 * and the dropdown row beside the computer header that draws it, so a merchant
 * changing their header finds both on one screen. What the menu lists — the
 * shortcut rows, the collection-page strip — applies on every device and stays
 * under Menu. Both halves still write the one `nav.menu` object.
 */

type Phone = ResolvedMenuSettings["mobile"];
type Desktop = ResolvedMenuSettings["desktop"];

/** What an unset phone-menu title shows, in the admin's own (English) editor. */
const DEFAULT_TITLE = "Menu";

const segments = <T extends string>(options: readonly MenuOption<T>[]) =>
  options.map((o) => ({ value: o.id, label: o.label, description: o.description }));

/**
 * A setting from the menu registry. Ids are only ever the registry's own, so
 * the narrowing cast is safe; the registry's resolver is the authority anyway.
 */
export function Choice<T extends string>({
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

/**
 * The phone's menu panel — what opens behind the Menu button or tab.
 *
 * `menuStyle` is the phone chrome's field, not `nav.menu`'s, and arrives as its
 * own pair: drawer versus sheet is the first thing a merchant decides about the
 * panel, so it leads it rather than sitting three blocks up in the arrangement.
 */
export function PhoneMenuPanelFields({
  value,
  onChange,
  menuStyle,
  onMenuStyle,
}: {
  value: Phone;
  onChange: (patch: Partial<Phone>) => void;
  menuStyle: MobileMenuStyle;
  onMenuStyle: (style: MobileMenuStyle) => void;
}) {
  const folds = value.layout === "accordion";
  return (
    <div className="space-y-3">
      <PartField label="Opens as">
        <SegmentedField
          label="Opens as"
          value={menuStyle}
          onChange={(v) => onMenuStyle(v === "sheet" ? "sheet" : "drawer")}
          options={[
            { value: "drawer", label: "Side drawer", description: "Slides in from the left" },
            { value: "sheet", label: "Bottom sheet", description: "Rises from the thumb" },
          ]}
        />
      </PartField>
      {menuStyle === "drawer" ? (
        <Choice
          label="Width"
          value={value.drawerWidth}
          options={MENU_DRAWER_WIDTHS}
          onChange={(drawerWidth) => onChange({ drawerWidth })}
        />
      ) : null}
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
      <PartSwitch
        label="Category pictures"
        detail="Beside each category, when it has one"
        checked={value.images}
        onCheckedChange={(images) => onChange({ images })}
      />
      <PartSwitch
        label="Sub-category pictures"
        detail="Beside each sub-category, when it has one"
        checked={value.subImages}
        onCheckedChange={(subImages) => onChange({ subImages })}
      />
      <PartField
        label="Title"
        hint={'Clear it to show no title. "Menu" follows the shopper\'s language.'}
      >
        <Input
          value={value.title ?? DEFAULT_TITLE}
          // Typing the default back re-links it to the shopper's language
          // rather than storing the English word for a Bangla shopper.
          onChange={(e) =>
            onChange({ title: e.target.value === DEFAULT_TITLE ? null : e.target.value })
          }
          maxLength={MENU_TEXT_MAX}
          className="h-8"
        />
      </PartField>
    </div>
  );
}

/** The computer header's menu row — whether there is one, and how it opens. */
export function DesktopMenuRowFields({
  value,
  onChange,
  headerHasRow,
  headerCanAddRow,
}: {
  value: Desktop;
  onChange: (patch: Partial<Desktop>) => void;
  /** The chosen header layout draws a menu row (or the merchant added one). */
  headerHasRow: boolean;
  /** The layout has no row of its own but can take one (`search-first`, `clinical`). */
  headerCanAddRow: boolean;
}) {
  return (
    <div className="space-y-3">
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
          This header layout has no menu row, so your menu shows on phones only.
        </PartHint>
      )}
    </div>
  );
}

/**
 * The shortcut rows a menu opens with — "All products" at the top, and an
 * "All ‹category›" row heading each group. Per device, because the two are
 * stored apart and a live shop may already answer them differently.
 */
export function MenuShortcutFields({
  value,
  onChange,
}: {
  value: ResolvedMenuSettings;
  onChange: (next: Partial<ResolvedMenuSettings>) => void;
}) {
  const phone = (p: Partial<Phone>) => onChange({ mobile: { ...value.mobile, ...p } });
  const desk = (p: Partial<Desktop>) => onChange({ desktop: { ...value.desktop, ...p } });
  return (
    <div className="space-y-3">
      <PartSwitch
        label={'"All products" first'}
        detail="Top of the phone menu — your whole catalogue"
        checked={value.mobile.allProducts}
        onCheckedChange={(allProducts) => phone({ allProducts })}
      />
      {value.mobile.allProducts ? (
        <Input
          aria-label="All products row label"
          value={value.mobile.allProductsLabel}
          onChange={(e) => phone({ allProductsLabel: e.target.value })}
          maxLength={MENU_TEXT_MAX}
          placeholder="All products"
          className="h-8"
        />
      ) : null}
      {value.mobile.layout !== "expanded" ? (
        <PartSwitch
          label={'"All ‹category›" in the phone menu'}
          detail="First in each group — the category's own page"
          checked={value.mobile.viewAll}
          onCheckedChange={(viewAll) => phone({ viewAll })}
        />
      ) : null}
      {value.desktop.openOn === "click" ? (
        <PartHint>
          Computer dropdowns open on click, so each one already starts with an
          &ldquo;All ‹category›&rdquo; row.
        </PartHint>
      ) : (
        <PartSwitch
          label={'"All ‹category›" in computer dropdowns'}
          detail="First in each dropdown — the category's own page"
          checked={value.desktop.viewAll}
          onCheckedChange={(viewAll) => desk({ viewAll })}
        />
      )}
    </div>
  );
}

/**
 * The sub-collection row on a collection page (All ‹Parent› · Art · Cartoon…).
 * Navigation into the category tree rather than part of one page, so it stays
 * with the menu; one answer per device, as stored.
 */
export function CollectionStripFields({
  value,
  onChange,
}: {
  value: ResolvedMenuSettings;
  onChange: (next: Partial<ResolvedMenuSettings>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Choice
        label="Phone"
        value={value.mobile.collectionStrip}
        options={MENU_COLLECTION_STRIPS}
        onChange={(collectionStrip) =>
          onChange({ mobile: { ...value.mobile, collectionStrip } })
        }
      />
      <Choice
        label="Computer"
        value={value.desktop.collectionStrip}
        options={MENU_COLLECTION_STRIPS}
        onChange={(collectionStrip) =>
          onChange({ desktop: { ...value.desktop, collectionStrip } })
        }
      />
    </div>
  );
}
