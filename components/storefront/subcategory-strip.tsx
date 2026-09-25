"use client";
// coding-standard: maintained

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  CatalogCategoryDetail,
  StorefrontImage,
} from "@/lib/storefront-client";
import type { Responsive } from "@/lib/storefront-builder/settings";
import { SfImage } from "@/components/storefront/sf-image";
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

/** Customize → Menu's `collectionStrip` values (`MenuCollectionStrip`). */
export type SubcategoryStyle = "scroll" | "wrap" | "tiles" | "hidden";

/**
 * What the row draws on each screen: the phone falls back to the desktop's
 * answer, and both fall back to the scroll row every page had before the
 * setting existed.
 */
export function subcategoryModes(display?: Responsive<SubcategoryStyle>): {
  phone: SubcategoryStyle;
  desktop: SubcategoryStyle;
} {
  const desktop = display?.base ?? "scroll";
  return { phone: display?.mobile ?? desktop, desktop };
}

/**
 * The drill-down row on a collection page: "All ‹Parent›" first, then one chip
 * per sub-collection, the current one highlighted.
 *
 * The first chip is the way back up (plan P6): on a child page the only other
 * route to the whole department was the breadcrumb.
 *
 * Unlike the header's category row this MAY scroll horizontally — every chip is
 * a plain link, so there is no dropdown for the scroll container to clip.
 *
 * **Style per screen, chosen in CSS.** The merchant picks scroll, wrap, tiles
 * or hidden per device under Customize → Menu (`nav.menu.*.collectionStrip`).
 * Both answers ride on the row as `data-sub-m` / `data-sub` and
 * `storefront.css` selects the layout, so the server paints the right one on
 * every device with no viewport branch in JavaScript. The picture slot is only emitted when a screen uses tiles.
 *
 * Every chip navigates to a new page, which remounts the row at scrollLeft 0.
 * On a phone with many siblings that hid the chip just tapped and made the
 * shopper swipe back to reach its neighbour, so the active chip is scrolled to
 * the middle of the row on mount. In wrap and tiles the row does not overflow,
 * so the same assignment is a no-op there.
 */
export function SubcategoryStrip({
  base,
  items,
  activeId,
  parent,
  parentImage,
  allLabel,
  display,
}: {
  base: string;
  items: CatalogCategory[];
  activeId?: string;
  /** The department — see `stripParent`. No chip without it. */
  parent?: { _id: string; name: string; slugPath?: string };
  /** The department's own picture, for the "All" tile. */
  parentImage?: StorefrontImage | null;
  /** "All {name}", already localized. */
  allLabel?: string;
  /** The merchant's style per screen; unset is a scroll row everywhere. */
  display?: Responsive<SubcategoryStyle>;
}) {
  const rowRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = rowRef.current;
    const current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !current) return;
    // Set scrollLeft directly: scrollIntoView would also scroll the page.
    el.scrollLeft = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2;
  }, [activeId]);

  const { phone, desktop } = subcategoryModes(display);
  if (items.length === 0 || (phone === "hidden" && desktop === "hidden")) return null;
  const onParent = !!parent && parent._id === activeId;
  const tiles = phone === "tiles" || desktop === "tiles";

  const chip = (key: string, href: string, name: string, active: boolean, image?: StorefrontImage | null) => (
    <Link key={key} href={href} aria-current={active ? "page" : undefined} className="sf-subchip">
      {tiles ? (
        <span className="sf-subchip-pic" aria-hidden="true">
          {image ? (
            <SfImage image={image} alt="" sizes="120px" decorative />
          ) : (
            name.trim().charAt(0).toUpperCase()
          )}
        </span>
      ) : null}
      <span className="sf-subchip-name">{name}</span>
    </Link>
  );

  return (
    <nav
      ref={rowRef}
      aria-label="Sub-categories"
      className="sf-substrip"
      data-sub={desktop}
      data-sub-m={phone}
    >
      {parent && allLabel
        ? chip(parent._id, collectionHref(base, parent), allLabel, onParent, parentImage)
        : null}
      {items.map((c) => chip(c._id, collectionHref(base, c), c.name, c._id === activeId, c.image))}
    </nav>
  );
}
