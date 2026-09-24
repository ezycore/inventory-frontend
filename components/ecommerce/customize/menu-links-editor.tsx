"use client";
// coding-standard: maintained

import { Plus } from "lucide-react";
import { useContentPages } from "@/services/api";
import type { StorefrontMenuItem } from "@/types";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import {
  MenuItemRow,
  newMenuItem,
  type NavOption,
} from "@/components/ecommerce/customize/menu-item-fields";

/** Swap entry `i` with its neighbour in `dir`; out of range is a no-op. */
function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const t = i + dir;
  if (t < 0 || t >= list.length) return list;
  const next = [...list];
  [next[i], next[t]] = [next[t], next[i]];
  return next;
}

/**
 * The merchant's own menu — a list of links, each with an optional dropdown.
 *
 * Category options are labelled "Parent › Child" and stored by PATH. The bare
 * leaf slug the editor used to store is only unique within its parent, so two
 * sub-categories called "Accessories" were indistinguishable here and the
 * storefront silently linked the first. Old items keep working: the storefront
 * resolves both shapes, and `resolveCategory` shows a leaf-slug item as the
 * option it matches until the merchant next edits it.
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
  const { data: pages } = useContentPages();

  const nameOf = (c: CollectionRowValue) => c.displayName || c.name;
  const byId = new Map(collections.map((c) => [c._id, c]));
  const categoryOptions: NavOption[] = collections.flatMap((c) => {
    if (!c.slugPath) return [];
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    return [{ label: parent ? `${nameOf(parent)} › ${nameOf(c)}` : nameOf(c), value: c.slugPath }];
  });
  // Parents before children, the storefront's own precedence for a bare slug.
  const ordered = [...collections].sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId));
  const resolveCategory = (value: string) =>
    value.includes("/")
      ? value
      : (ordered.find((c) => c.slug === value)?.slugPath ?? value);
  const subcategoryCount = (value: string) => {
    const path = resolveCategory(value);
    const node = collections.find((c) => c.slugPath === path);
    return node ? collections.filter((c) => c.parentId === node._id).length : 0;
  };
  const pageOptions: NavOption[] = (pages ?? []).map((p) => ({
    label: p.title,
    value: p.slug,
  }));

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
