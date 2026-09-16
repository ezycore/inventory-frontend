// coding-standard: maintained
import type { ReactNode } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import { getStoreContext, isBuilderPreviewFrame } from "@/lib/storefront-host";
import { getStore, getStorefrontPage, requestStorefront } from "@/lib/storefront-server";
import { BuilderPageBody } from "@/components/storefront-builder/builder-page-body";
import { BuilderPagePreview } from "@/components/storefront-builder/builder-page-preview";

/**
 * A system page: the store's builder page for this address when it has one, and
 * otherwise the page the storefront has always drawn.
 *
 * Every system route is the same three lines, so they share this rather than
 * repeating them — and repeating them is how one route would end up drawing the
 * builder page while another silently ignored it.
 *
 * `children` is the page's own view, which is ALSO what the page's core section
 * renders. That is what makes a moved page identical: the same component draws
 * it either way, and only the merchant's own sections above and below it are
 * new. A store that has not moved this page — every store until its own cutover
 * — hears a 404 from the page read, which is the normal answer, not an error.
 *
 * `product` is the product route's own product: it tells the sections they are
 * on the product page and hands the ones that sell a product (offer, order form,
 * order bar, related products) the product to sell.
 */
export async function SystemPage({
  path,
  product,
  children,
}: {
  path: string;
  product?: CatalogProduct;
  children: ReactNode;
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
  return <>{children}</>;
}
