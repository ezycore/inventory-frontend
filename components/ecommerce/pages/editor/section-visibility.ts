// coding-standard: maintained
import type { ProductTargets } from "@/lib/storefront-builder/product-targets";
import type { EditorSection } from "./section-instances";

type Screen = "desktop" | "mobile";
type Visibility = NonNullable<EditorSection["visibility"]>;

/**
 * A section's `visibility` with `next` merged in, or none at all when nothing
 * is left: shown everywhere is the default, stored as no key rather than a box
 * of `true`s. Each writer replaces only its own part — the screens never erase
 * the products, and the products never erase the screens.
 */
function withVisibility(section: EditorSection, next: Visibility): EditorSection {
  const { visibility: _previous, ...rest } = section;
  const kept = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
  return Object.keys(kept).length > 0 ? { ...rest, visibility: kept as Visibility } : rest;
}

/** Shown on, or hidden from, one screen. A hidden screen is stored as `false`; a shown one as nothing. */
export function withScreen(section: EditorSection, screen: Screen, visible: boolean): EditorSection {
  return withVisibility(section, { ...section.visibility, [screen]: visible ? undefined : false });
}

/** Limited to some products on the product page, or — `undefined` — shown on every one. */
export function withProductTargets(section: EditorSection, targets: ProductTargets | undefined): EditorSection {
  const named = targets && (targets.categories?.length || targets.tags?.length) ? targets : undefined;
  return withVisibility(section, {
    ...section.visibility,
    products: named
      ? {
          ...(named.categories?.length ? { categories: [...named.categories] } : {}),
          ...(named.tags?.length ? { tags: [...named.tags] } : {}),
        }
      : undefined,
  });
}

/**
 * A text or collapsible part's settings limited to `targets`, or — `undefined`
 * — shown on every product: its `categoryIds` / `tagIds`, written only when
 * they name something, since the backend refuses an empty list.
 */
export function withPartTargets(
  settings: Record<string, unknown>,
  targets: ProductTargets | undefined,
): Record<string, unknown> {
  const { categoryIds: _categories, tagIds: _tags, ...rest } = settings;
  return {
    ...rest,
    ...(targets?.categories?.length ? { categoryIds: [...targets.categories] } : {}),
    ...(targets?.tags?.length ? { tagIds: [...targets.tags] } : {}),
  };
}
