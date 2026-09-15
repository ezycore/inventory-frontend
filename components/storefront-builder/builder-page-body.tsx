// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import type { StorefrontReads } from "@/lib/storefront-server";
import { PageSections } from "@/components/storefront-builder/page-sections";
import {
  loadBuilderPageData,
  type BuilderPage,
} from "@/components/storefront-builder/builder-page-data";

/**
 * A builder page's sections, drawn with the data they asked for — the body of
 * the cached `/pages/<slug>` route.
 *
 * `reads` is a parameter because the owner-preview route loads the same data
 * through the request (see `loadBuilderPageData`); it draws with
 * `PageDraftPreview` instead, so edits show before they are saved.
 */
export async function BuilderPageBody({
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
  page: BuilderPage;
}) {
  const { sections, context, data } = await loadBuilderPageData(reads, { slug, base, store, page });
  return <PageSections sections={sections} context={context} data={data} />;
}
