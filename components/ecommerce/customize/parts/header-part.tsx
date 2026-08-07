"use client";
// coding-standard: maintained

import { LayoutGrid, Menu, Pencil, Plus } from "lucide-react";
import { useContentPages } from "@/services/api";
import type { HeaderMenuSource } from "@/lib/storefront-client";
import type { StorefrontMenuItem } from "@/types";
import { Button } from "@/ui/components/button";
import { OptionCard } from "@/ui/components/option-card";
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import {
  MenuItemRow,
  newMenuItem,
  type NavOption,
} from "@/components/ecommerce/customize/menu-item-fields";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Header — its layout and its menu, together. They were two tabs apart before,
 * which meant changing "the header" took two saves in two places.
 *
 * The menu source is explicit (`templates.headerMenu`) precisely because it used
 * to be inferred: a non-empty custom menu silently replaced the collections,
 * with nothing in the admin saying so.
 */
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

export function HeaderPart({
  draft,
  patch,
  patchTemplate,
  onManageCollections,
}: {
  onManageCollections: () => void;
} & Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
  const { data: pages } = useContentPages();
  const source = draft.templates.headerMenu as HeaderMenuSource;
  const header = draft.navHeader;
  const setHeader = (navHeader: StorefrontMenuItem[]) => patch({ navHeader });
  const listed = draft.collections.filter((c) => c.isListed);

  // Menu links target categories by slug; slugless ones (legacy seed data) are
  // unlinkable — and Radix Select crashes on empty-string item values.
  const categoryOptions: NavOption[] = draft.collections.flatMap((c) =>
    c.slug ? [{ label: c.displayName || c.name, value: c.slug }] : [],
  );
  const pageOptions: NavOption[] = (pages ?? []).map((p) => ({
    label: p.title,
    value: p.slug,
  }));

  const patchItem = (i: number, p: Partial<StorefrontMenuItem>) =>
    setHeader(header.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const removeItem = (i: number) => setHeader(header.filter((_, idx) => idx !== i));
  const moveItem = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= header.length) return;
    const next = [...header];
    [next[i], next[t]] = [next[t], next[i]];
    setHeader(next);
  };
  const addChild = (i: number) =>
    setHeader(
      header.map((it, idx) =>
        idx === i ? { ...it, children: [...(it.children ?? []), newMenuItem()] } : it,
      ),
    );
  const patchChild = (i: number, ci: number, p: Partial<StorefrontMenuItem>) =>
    setHeader(
      header.map((it, idx) =>
        idx === i
          ? {
              ...it,
              children: (it.children ?? []).map((c, cidx) =>
                cidx === ci ? { ...c, ...p } : c,
              ),
            }
          : it,
      ),
    );
  const removeChild = (i: number, ci: number) =>
    setHeader(
      header.map((it, idx) =>
        idx === i
          ? { ...it, children: (it.children ?? []).filter((_, x) => x !== ci) }
          : it,
      ),
    );

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="header"
          value={draft.templates.header}
          onChange={(v) => patchTemplate("header", v)}
        />
      </PartBlock>

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
                No collections are listed, so the header has no links.
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
                  <span className="truncate font-medium">
                    {c.displayName || c.name}
                  </span>
                  <span className="ml-auto flex-none text-xs text-muted-foreground">
                    /{c.slug}
                  </span>
                </div>
              ))
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onManageCollections}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Rename, reorder or hide
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {header.length === 0 ? (
            <PartHint>No menu items yet.</PartHint>
          ) : (
            header.map((item, i) => (
              <MenuItemRow
                key={i}
                item={item}
                index={i}
                count={header.length}
                categoryOptions={categoryOptions}
                pageOptions={pageOptions}
                // One collections block per menu: offer the type only to the row
                // that already is one, or to all rows while none exists.
                allowCollections={
                  item.type === "collections" ||
                  !header.some((it) => it.type === "collections")
                }
                onPatch={(p) => patchItem(i, p)}
                onRemove={() => removeItem(i)}
                onMove={(dir) => moveItem(i, dir)}
                onAddChild={() => addChild(i)}
                onPatchChild={(ci, p) => patchChild(i, ci, p)}
                onRemoveChild={(ci) => removeChild(i, ci)}
              />
            ))
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHeader([...header, newMenuItem()])}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add item
          </Button>
        </div>
      )}
    </>
  );
}
