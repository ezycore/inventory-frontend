"use client";
// coding-standard: maintained

import { Plus } from "lucide-react";
import type { StorefrontMenuItem } from "@/types";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import { MenuItemRow, newMenuItem } from "@/components/ecommerce/customize/menu-item-fields";
import { moveItem as move, useNavLinkOptions } from "@/components/ecommerce/customize/use-nav-link-options";

/**
 * The merchant's own menu — a list of links, each with an optional dropdown.
 *
 * Category and page choices come from `useNavLinkOptions`, shared with the
 * footer's link rows.
 */
export function MenuLinksEditor({
  items,
  collections,
  onChange,
}: {
  items: StorefrontMenuItem[];
  collections: CollectionRowValue[];
  onChange: (items: StorefrontMenuItem[]) => void;
}) {
  const { categoryOptions, pageOptions, resolveCategory } = useNavLinkOptions(collections);
  const subcategoryCount = (value: string) => {
    const path = resolveCategory(value);
    const node = collections.find((c) => c.slugPath === path);
    return node ? collections.filter((c) => c.parentId === node._id).length : 0;
  };
  const setItem = (i: number, fn: (it: StorefrontMenuItem) => StorefrontMenuItem) =>
    onChange(items.map((it, idx) => (idx === i ? fn(it) : it)));
  const setChildren = (
    i: number,
    fn: (kids: StorefrontMenuItem[]) => StorefrontMenuItem[],
  ) => setItem(i, (it) => ({ ...it, children: fn(it.children ?? []) }));

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <PartHint>No menu items yet.</PartHint>
      ) : (
        items.map((item, i) => (
          <MenuItemRow
            key={i}
            item={item}
            index={i}
            count={items.length}
            categoryOptions={categoryOptions}
            pageOptions={pageOptions}
            allowCollections={
              item.type === "collections" ||
              !items.some((it) => it.type === "collections")
            }
            resolveCategory={resolveCategory}
            subcategoryCount={item.type === "category" ? subcategoryCount(item.value) : 0}
            onPatch={(p) => setItem(i, (it) => ({ ...it, ...p }))}
            onRemove={() => onChange(items.filter((_, idx) => idx !== i))}
            onMove={(dir) => onChange(move(items, i, dir))}
            onAddChild={() => setChildren(i, (kids) => [...kids, newMenuItem()])}
            onPatchChild={(ci, p) =>
              setChildren(i, (kids) => kids.map((c, x) => (x === ci ? { ...c, ...p } : c)))
            }
            onRemoveChild={(ci) => setChildren(i, (kids) => kids.filter((_, x) => x !== ci))}
            onMoveChild={(ci, dir) => setChildren(i, (kids) => move(kids, ci, dir))}
          />
        ))
      )}
      <Button size="sm" variant="outline" onClick={() => onChange([...items, newMenuItem()])}>
        <Plus className="mr-1.5 h-4 w-4" /> Add item
      </Button>
    </div>
  );
}
