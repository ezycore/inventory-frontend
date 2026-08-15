"use client";
// coding-standard: maintained
/**
 * The merchant-configured product rows on the homepage (Customize → Home rows).
 *
 * Rows are server-rendered: the page fetches every saved row in parallel and
 * hands the products down, so the homepage stays crawlable HTML rather than a
 * grid of skeletons. `items` is therefore present on every real visit, and the
 * client fetch in `useHomeRowProducts` is **only** for the Customize preview,
 * where the merchant has just added or re-pointed a row that no server render
 * knows about yet — an unsaved row cannot be in the SSR payload, and a preview
 * that showed nothing for it would read as a broken control.
 */

import type { CatalogProduct } from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import {
  findRowCategory,
  homeRowQuery,
  homeRowTitle,
} from "@/lib/storefront-home-rows";
import { useStoreProducts } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { SectionTitle } from "@/components/storefront/sf-bits";
import type { HomeRowData, TplProps } from "@/components/storefront/home/home-shared";
import { Grid, ViewAll, wrap } from "@/components/storefront/home/home-shared";

/**
 * The products one row shows — the server's when it has them, a live fetch
 * otherwise (preview only, see above). Templates that draw their own markup
 * around a row use this directly; `HomeProductRow` is the standard chrome.
 *
 * Safe to call with no row at all: Hero Split and Minimal pass `rows[0]`, and a
 * store whose owner cleared every row has none.
 */
export function useHomeRowProducts(
  data: HomeRowData | undefined,
  categories: TplProps["categories"],
): CatalogProduct[] {
  const { slug } = useStoreContext();
  const params = data ? homeRowQuery(data.row, categories) : null;
  // `params` is null for a row whose collection no longer exists; asking then
  // would fetch the whole catalogue under a heading naming a deleted one.
  const { data: fetched } = useStoreProducts(
    slug,
    params ?? {},
    !data?.items && !!params,
  );
  return data?.items ?? fetched?.items ?? [];
}

export function HomeProductRow({
  data,
  base,
  currency,
  categories,
  t,
  /** The trailing row tightens the gap above the footer, as New arrivals did. */
  last,
}: {
  data: HomeRowData;
  base: string;
  currency?: string;
  categories: TplProps["categories"];
  t: Dict;
  last?: boolean;
}) {
  const { row } = data;
  const products = useHomeRowProducts(data, categories);
  if (products.length === 0) return null;

  // "View all" goes where the row's own products live — the collection page for
  // a category row, the full catalogue for the two catalogue-wide sources.
  const category = findRowCategory(categories, row.categoryId)?.category;
  const href =
    row.source === "category" && category
      ? collectionHref(base, category)
      : storeHref(base, "/products");

  return (
    <div style={{ ...wrap, padding: last ? "22px var(--pad) 10px" : "22px var(--pad)" }}>
      <SectionTitle action={<ViewAll href={href} label={t.viewAll} />}>
        {homeRowTitle(row, t, categories)}
      </SectionTitle>
      <Grid products={products} currency={currency} variant={row.layout ?? "full"} />
    </div>
  );
}

/** Every configured row, in the merchant's order. */
export function HomeProductRows({
  rows,
  base,
  currency,
  categories,
  t,
}: {
  rows: HomeRowData[];
  base: string;
  currency?: string;
  categories: TplProps["categories"];
  t: Dict;
}) {
  return (
    <>
      {rows.map((data, i) => (
        // `id` is the merchant's stable key — what survives a reorder. The index
        // is only a fallback for the instant a brand-new row exists without one.
        <HomeProductRow
          key={data.row.id || `row-${i}`}
          data={data}
          base={base}
          currency={currency}
          categories={categories}
          t={t}
          last={i === rows.length - 1}
        />
      ))}
    </>
  );
}
