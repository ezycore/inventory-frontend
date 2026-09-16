// coding-standard: maintained
import type { CatalogProduct, StorefrontStore } from "@/lib/storefront-client";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import type { StorefrontReads } from "@/lib/storefront-server";
import { loadBuilderPageData } from "@/components/storefront-builder/builder-page-data";
import { PageDraftPreview } from "@/components/storefront-builder/page-draft-preview";
import type { StorefrontPublicPage } from "@/types/api";

/**
 * A builder page under owner preview — at its own address, at `/` when it is
 * the homepage, or at a system page's route inside the page editor's frame. It
 * draws through `PageDraftPreview`, which the editor's frame redraws as the
 * merchant edits, before anything is saved. Every store-wide list is loaded up
 * front for it: a section added in the editor may need a list the saved page did
 * not.
 *
 * `pageContext` and `product` are the system page's, as `SystemPage` has them:
 * on the product page they hand the add-ons (offer, order form, order bar,
 * related products) the product the route resolved, exactly as the shopper's
 * render does.
 */
export async function BuilderPagePreview({
  reads,
  slug,
  base,
  store,
  page,
  pageContext,
  product,
}: {
  reads: StorefrontReads;
  slug: string;
  base: string;
  store: StorefrontStore;
  page: NonNullable<StorefrontPublicPage["page"]>;
  pageContext?: SectionPageContext;
  product?: CatalogProduct;
}) {
  const { instances, data, context } = await loadBuilderPageData(reads, {
    slug,
    base,
    store,
    page,
    allLists: true,
    pageContext,
    product,
  });
  return (
    <PageDraftPreview
      slug={slug}
      instances={instances}
      data={data}
      context={context}
      pageContext={pageContext}
    />
  );
}
