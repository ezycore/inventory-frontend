"use client";
// coding-standard: maintained

import {
  MENU_CHIPS,
  MENU_COLLECTION_STRIPS,
  MENU_DRAWER_WIDTHS,
  MENU_DROPDOWNS,
  MENU_MOBILE_LAYOUTS,
  MENU_OPEN_GROUPS,
  MENU_OPEN_ON,
  MENU_OVERFLOW,
  MENU_RAIL_OPEN,
  MENU_TEXT_MAX,
  type MenuOption,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import { Input } from "@/ui/components/input";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import {
  PartBlock,
  PartField,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";

type Phone = ResolvedMenuSettings["mobile"];

/** What an unset phone-menu title shows, in the admin's own (English) editor. */
const DEFAULT_TITLE = "Menu";
type Desktop = ResolvedMenuSettings["desktop"];

/** Shared by both devices — the same row, answered per screen. */
const STRIP_LABEL = "Sub-categories on a collection page";
const STRIP_HINT = "The row under a collection's heading — All ‹category›, then each sub-category.";

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
  slidesIn,
}: {
  value: Phone;
  onChange: (patch: Partial<Phone>) => void;
  /** Whether the Phone bar shows the category strip at all. */
  hasChipsRow: boolean;
  /** The menu slides in from the side (hamburger layouts), rather than rising as a full-width sheet. */
  slidesIn: boolean;
}) {
  const folds = value.layout === "accordion";
  return (
    <PartBlock label="On a phone">
      <PartField
        label="Menu title"
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
      {slidesIn ? (
        <Choice
          label="Menu width"
          value={value.drawerWidth}
          options={MENU_DRAWER_WIDTHS}
          onChange={(drawerWidth) => onChange({ drawerWidth })}
        />
      ) : null}
      <PartSwitch
        label={'An "All products" row'}
        detail="First in the menu — your whole catalogue"
        checked={value.allProducts}
        onCheckedChange={(allProducts) => onChange({ allProducts })}
      />
      {value.allProducts ? (
        <Input
          aria-label="All products row label"
          value={value.allProductsLabel}
          onChange={(e) => onChange({ allProductsLabel: e.target.value })}
          maxLength={MENU_TEXT_MAX}
          placeholder="All products"
          className="h-8"
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
      <PartSwitch
        label="Sub-category pictures"
        detail="Beside each sub-category, when it has one"
        checked={value.subImages}
        onCheckedChange={(subImages) => onChange({ subImages })}
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
      <Choice
        label={STRIP_LABEL}
        hint={STRIP_HINT}
        value={value.collectionStrip}
        options={MENU_COLLECTION_STRIPS}
        onChange={(collectionStrip) => onChange({ collectionStrip })}
      />
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
          {value.openOn === "click" ? (
            <PartHint>
              Opening on click adds an &ldquo;All ‹category›&rdquo; row to every
              dropdown — the category name no longer goes to its page.
            </PartHint>
          ) : (
            <PartSwitch
              label={'An "All ‹category›" row'}
              detail="First in each dropdown — the category's own page"
              checked={value.viewAll}
              onCheckedChange={(viewAll) => onChange({ viewAll })}
            />
          )}
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
      <Choice
        label={STRIP_LABEL}
        hint={STRIP_HINT}
        value={value.collectionStrip}
        options={MENU_COLLECTION_STRIPS}
        onChange={(collectionStrip) => onChange({ collectionStrip })}
      />
    </PartBlock>
  );
}
