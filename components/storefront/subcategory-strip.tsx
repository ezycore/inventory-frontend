// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  CatalogCategoryDetail,
} from "@/lib/storefront-client";
import { collectionHref } from "@/lib/storefront-links";

/**
 * Which sub-collections belong at the top of a collection page.
 *
 * - On a PARENT page (`/lights`) → its own children.
 * - On a CHILD page (`/lights/led`) → its **siblings**, with the current one
 *   marked active. The tree is exactly two levels, so a child has no children of
 *   its own; showing nothing there would make every drill-down a dead end and
 *   push the shopper back to the browser's Back button to try the next one.
 *
 * Sourced from the category tree rather than the collection payload because
 * `GET …/categories/resolve` returns a node's `parent` but not its `children` —
 * and the tree is already fetched by the shell for the header nav, so this costs
 * no extra request.
 */
export function subcategoriesFor(
  collection: CatalogCategoryDetail | undefined,
  tree: CatalogCategory[],
): CatalogCategory[] {
  if (!collection) return [];
  const rootId = collection.isSubcategory
    ? collection.parent?._id
    : collection._id;
  if (!rootId) return [];
  return tree.find((c) => c._id === rootId)?.children ?? [];
}

/**
 * The department a collection page belongs to — itself on a parent page, its
 * parent on a child page. The strip's "All ‹Parent›" chip links here.
 */
export function stripParent(
  collection: CatalogCategoryDetail | undefined,
): { _id: string; name: string; slugPath?: string } | undefined {
  if (!collection) return undefined;
  return collection.isSubcategory ? (collection.parent ?? undefined) : collection;
}

/**
 * The drill-down row on a collection page: "All ‹Parent›" first, then one chip
 * per sub-collection, the current one highlighted.
 *
 * The first chip is the way back up (plan P6): on a child page the only other
 * route to the whole department was the breadcrumb.
 *
 * Holds no state, so it renders server-side too. Unlike the header's category
 * row this MAY scroll horizontally — every chip is a plain link, so there is no
 * dropdown for the scroll container to clip.
 */
export function SubcategoryStrip({
  base,
  items,
  activeId,
  parent,
  allLabel,
}: {
  base: string;
  items: CatalogCategory[];
  activeId?: string;
  /** The department — see `stripParent`. No chip without it. */
  parent?: { _id: string; name: string; slugPath?: string };
  /** "All {name}", already localized. */
  allLabel?: string;
}) {
  if (items.length === 0) return null;
  const onParent = !!parent && parent._id === activeId;

  return (
    <nav aria-label="Sub-categories" style={row}>
      {parent && allLabel ? (
        <Link
          href={collectionHref(base, parent)}
          aria-current={onParent ? "page" : undefined}
          style={onParent ? chipActive : chip}
        >
          {allLabel}
        </Link>
      ) : null}
      {items.map((c) => {
        const active = c._id === activeId;
        return (
          <Link
            key={c._id}
            href={collectionHref(base, c)}
            aria-current={active ? "page" : undefined}
            style={active ? chipActive : chip}
          >
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}

const row: CSSProperties = {
  display: "flex",
  gap: 8,
  // Safe to scroll here (see the component note): these are flat links.
  overflowX: "auto",
  // Phones overlay their scrollbar; desktop browsers drew a grey bar under the
  // chips. The strip still scrolls by swipe, wheel and trackpad.
  scrollbarWidth: "none",
  paddingBottom: 4,
  marginBottom: 14,
};

const chipBase: CSSProperties = {
  flex: "none",
  borderRadius: 999,
  // 12px vertical around a ~16px line box clears the 40px tap floor.
  padding: "12px 15px",
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: "nowrap",
  border: "1px solid var(--border-strong)",
};

const chip: CSSProperties = {
  ...chipBase,
  background: "var(--card)",
  color: "var(--muted)",
};

const chipActive: CSSProperties = {
  ...chipBase,
  background: "var(--primary-soft)",
  borderColor: "transparent",
  color: "var(--primary)",
  fontWeight: 700,
};
