// coding-standard: maintained
import { useStorefrontPages } from "@/services/api";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import type { NavOption } from "@/components/ecommerce/customize/menu-item-fields";

/**
 * The choices a link row offers — categories labelled "Parent › Child" and
 * stored by PATH, and the store's written pages by slug. Shared by the header
 * menu and the footer so a link means the same thing in both.
 *
 * The bare leaf slug the menu editor used to store is only unique within its
 * parent, so two sub-categories called "Accessories" were indistinguishable and
 * the storefront silently linked the first. Old items keep working: the
 * storefront resolves both shapes, and `resolveCategory` shows a leaf-slug item
 * as the option it matches until the merchant next edits it.
 */
export function useNavLinkOptions(collections: CollectionRowValue[]) {
  const { data: pages } = useStorefrontPages({ kind: "content", limit: 100 });

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
  const pageOptions: NavOption[] = (pages?.items ?? []).flatMap((p) =>
    p.slug ? [{ label: p.title, value: p.slug }] : [],
  );

  return { categoryOptions, pageOptions, resolveCategory };
}

/** Swap entry `i` with its neighbour in `dir`; out of range is a no-op. */
export function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const t = i + dir;
  if (t < 0 || t >= list.length) return list;
  const next = [...list];
  [next[i], next[t]] = [next[t], next[i]];
  return next;
}
