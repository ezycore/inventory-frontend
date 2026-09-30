// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { CatalogProduct } from "@/lib/storefront-client";
import { getStoreContext, isBuilderPreviewFrame } from "@/lib/storefront-host";
import { getStore, getStorefrontPage, requestStorefront } from "@/lib/storefront-server";
import { BuilderPageBody } from "@/components/storefront-builder/builder-page-body";
import { BuilderPagePreview } from "@/components/storefront-builder/builder-page-preview";

/**
 * A page the store draws at a fixed address: its builder page, or — when it has
 * none — `withoutPage`, or the shop's 404.
 *
 * The seven system pages (home, collection, product, search, cart, checkout,
 * account) always have a builder page, so their routes pass no `withoutPage`: a
 * store missing one answers 404. A campaign's own page is optional, and its
 * route passes the campaign's default view.
 *
 * `product` is the product route's own product: it tells the sections they are
 * on the product page and hands the ones that sell a product (offer, order form,
 * order bar, related products) the product to sell.
 */
export async function SystemPage({
  path,
  product,
  withoutPage,
}: {
  path: string;
  product?: CatalogProduct;
  /** What the address draws when the store has no page there; unset ⇒ 404. */
  withoutPage?: ReactNode;
}) {
  const { slug, base } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  const builder = store ? await getStorefrontPage(slug, path) : null;
  if (store && builder?.page) {
    // Inside the page editor's frame the page is the draft, redrawn as the
    // merchant edits — the same preview a content or landing page gets.
    if (await isBuilderPreviewFrame()) {
      return (
        <BuilderPagePreview
          reads={requestStorefront}
          slug={slug}
          base={base}
          store={store}
          page={builder.page}
          pageContext={product ? "product" : undefined}
          product={product}
        />
      );
    }
    return (
      <BuilderPageBody
        reads={requestStorefront}
        slug={slug}
        base={base}
        store={store}
        page={builder.page}
        pageContext={product ? "product" : undefined}
        product={product}
      />
    );
  }
  if (withoutPage === undefined) notFound();
  return <>{withoutPage}</>;
}
