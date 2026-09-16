// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import type { StorefrontReads } from "@/lib/storefront-server";
import { loadBuilderPageData } from "@/components/storefront-builder/builder-page-data";
import { PageDraftPreview } from "@/components/storefront-builder/page-draft-preview";
import type { StorefrontPublicPage } from "@/types/api";

/**
 * A builder page under owner preview — at its own address, at `/` when it is
 * the homepage, or at a system page's route inside the page editor's frame. It draws through `PageDraftPreview`, which the editor's frame
 * redraws as the merchant edits, before anything is saved. Every store-wide list
 * is loaded up front for it: a section added in the editor may need a list the
 * saved page did not.
 */
export async function BuilderPagePreview({
  reads,
  slug,
  base,
  store,
  page,
}: {
  reads: StorefrontReads;
  slug: string;
  base: string;
  store: StorefrontStore;
  page: NonNullable<StorefrontPublicPage["page"]>;
}) {
  const { instances, data, context } = await loadBuilderPageData(reads, {
    slug,
    base,
    store,
    page,
    allLists: true,
  });
  return <PageDraftPreview slug={slug} instances={instances} data={data} context={context} />;
}
