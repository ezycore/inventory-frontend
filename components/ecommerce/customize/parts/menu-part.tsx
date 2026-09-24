"use client";
// coding-standard: maintained

import { useState } from "react";
import { LayoutGrid, Menu, Pencil } from "lucide-react";
import type { HeaderMenuSource } from "@/lib/storefront-client";
import {
  MENU_SUBCATEGORIES,
  customMenuLacksCategories,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import { Button } from "@/ui/components/button";
import { OptionCard } from "@/ui/components/option-card";
import { SegmentedField } from "@/ui/components/segmented-field";
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import { MenuLinksEditor } from "@/components/ecommerce/customize/menu-links-editor";
import {
  DesktopMenuFields,
  PhoneMenuFields,
} from "@/components/ecommerce/customize/menu-behaviour-fields";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

const SOURCES: {
  id: HeaderMenuSource;
  label: string;
  description: string;
  icon: typeof LayoutGrid;
}[] = [
  {
    id: "collections",
    label: "Collections",
    description: "Your listed categories, in order",
    icon: LayoutGrid,
  },
  {
    id: "custom",
    label: "Custom menu",
    description: "Links you build, with dropdowns",
    icon: Menu,
  },
];

/** Header layouts with no menu row of their own, which can take one on request. */
const ROWLESS_HEADERS = new Set(["search-first", "clinical"]);

type Device = "mobile" | "desktop";

/**
 * Menu — what is in the shop's menu and how it opens, on each device.
 *
 * One set of links drives every menu surface (`lib/storefront-menu.ts`): the
 * desktop header row, the phone menu panel, and — for the category tree — the
 * phone strip and the category sidebar. Split out of Header on 2026-09-24,
 * because it stopped being a header setting the moment the phone obeyed it.
 *
 * Phone first (the owner's standing rule): the device switch opens on Phone
 * and the preview opens on a phone with it.
 */
export function MenuPart({
  draft,
  patch,
  patchTemplate,
  onManageCollections,
  onPreviewDevice,
}: {
  /**
   * Opens the collections panel. Omitted for a role without `storefront.manage`:
   * renaming, listing and reordering collections are catalog writes.
   */
  onManageCollections?: () => void;
  onPreviewDevice?: (device: Device) => void;
} & Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
  const [device, setDevice] = useState<Device>("mobile");
  const source = draft.templates.headerMenu as HeaderMenuSource;
  const listed = draft.collections.filter((c) => c.isListed);
  const menu = draft.navMenu;
  const setMenu = (next: Partial<ResolvedMenuSettings>) =>
    patch({ navMenu: { ...menu, ...next } });

  const header = draft.templates.header;
  const rowless = ROWLESS_HEADERS.has(header);

  return (
    <>
      <PartBlock label="Menu links come from">
        <div className="grid grid-cols-2 gap-2">
          {SOURCES.map((s) => (
            <OptionCard
              key={s.id}
              selected={source === s.id}
              onSelect={() => patchTemplate("headerMenu", s.id)}
              label={s.label}
              description={s.description}
              icon={s.icon}
              badge={
                s.id === "collections" ? (
                  <span className="flex-none whitespace-nowrap rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                    {listed.length} listed
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      </PartBlock>

      {source === "collections" ? (
        <div className="space-y-2.5">
          <div className="overflow-hidden rounded-lg border bg-background">
            {listed.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                No collections are listed, so the menu has no links.
              </p>
            ) : (
              listed.map((c, i) => (
                <div
                  key={c._id}
                  className="flex items-center gap-2.5 border-b p-2 text-sm last:border-0"
                >
                  <span className="w-3 flex-none text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className={c.parentId ? "truncate pl-3 text-muted-foreground" : "truncate font-medium"}>
                    {c.displayName || c.name}
                  </span>
                  <span className="ml-auto flex-none text-xs text-muted-foreground">
                    /{c.slugPath ?? c.slug}
                  </span>
                </div>
              ))
            )}
          </div>
          {onManageCollections && (
            <Button variant="outline" size="sm" className="w-full" onClick={onManageCollections}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Rename, reorder or hide
            </Button>
          )}
        </div>
      ) : (
        <>
          <MenuLinksEditor
            items={draft.navHeader}
            collections={draft.collections}
            onChange={(navHeader) => patch({ navHeader })}
          />
          {customMenuLacksCategories(source, draft.navHeader) ? (
            <PartHint>
              Your menu has no categories, so phones will list your categories above
              these links — a shopper can always reach a department.
            </PartHint>
          ) : null}
        </>
      )}

      <PartBlock
        label="Sub-categories"
        hint="Applies to the menu and the category sidebar. Links you add by hand under an item always show."
      >
        <SegmentedField
          label="Sub-categories"
          value={menu.subcategories}
          onChange={(v) => setMenu({ subcategories: v === "off" ? "off" : "auto" })}
          options={MENU_SUBCATEGORIES.map((o) => ({
            value: o.id,
            label: o.label,
            description: o.description,
          }))}
        />
      </PartBlock>

      <PartBlock label="How it opens">
        <SegmentedField
          label="Device"
          caption={false}
          value={device}
          onChange={(v) => {
            const next: Device = v === "desktop" ? "desktop" : "mobile";
            setDevice(next);
            onPreviewDevice?.(next);
          }}
          options={[
            { value: "mobile", label: "Phone" },
            { value: "desktop", label: "Computer" },
          ]}
        />
      </PartBlock>

      {device === "mobile" ? (
        <PhoneMenuFields
          value={menu.mobile}
          onChange={(p) => setMenu({ mobile: { ...menu.mobile, ...p } })}
          hasChipsRow={draft.mobile.row === "chips"}
        />
      ) : (
        <DesktopMenuFields
          value={menu.desktop}
          onChange={(p) => setMenu({ desktop: { ...menu.desktop, ...p } })}
          headerHasRow={!rowless || menu.desktop.row}
          headerCanAddRow={rowless}
          hasSidebar={draft.templates.shell === "rail"}
        />
      )}
    </>
  );
}
