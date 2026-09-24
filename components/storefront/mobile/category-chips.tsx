"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CatalogCategory, StorefrontStore } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { chipNodes } from "@/lib/storefront-menu";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStoreMenu } from "@/components/storefront/use-store-menu";
import { useStorePathname } from "@/services/storefront/use-store-pathname";

/**
 * The departments as a scrolling row of text chips.
 *
 * Text, not the homepage's photo tiles: this is chrome on every page, so it has
 * to stay one 40px line whatever the merchant's category artwork looks like.
 * Renders nothing for a shop with no categories rather than an empty track.
 *
 * Always the CATEGORY tree, never the custom menu — it is a category strip.
 * `menu.mobile.chips` decides whether the sub-categories ride along: a shop with
 * two departments had a row of two chips here and no way to surface the forty
 * sub-categories beneath them.
 */
export function CategoryChips({
  base,
  store,
  categories,
}: {
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
}) {
  const { t } = useStorefrontUI();
  const menu = useStoreMenu(store, categories, base);
  const pathname = useStorePathname();
  const chips = chipNodes(menu.categories, menu.settings.mobile.chips, pathname);
  if (!chips.length) return null;
  return (
    <div className="sf-mchips" style={{ marginTop: 8 }}>
      <Link href={storeHref(base, "/products")} className="sf-mchip">
        {t.allProducts}
      </Link>
      {chips.map((c) => (
        <Link key={c.key} href={c.href} className="sf-mchip">
          {c.label}
        </Link>
      ))}
    </div>
  );
}
