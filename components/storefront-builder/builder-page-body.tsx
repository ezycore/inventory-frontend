// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import type { StorefrontReads } from "@/lib/storefront-server";
import { mediaFitFor, mediaRatioFor, resolveTemplates } from "@/lib/storefront-templates";
import type { StorefrontPublicPage } from "@/types/api";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  sectionListNeeds,
} from "@/components/storefront-builder/page-sections";

export type BuilderPage = NonNullable<StorefrontPublicPage["page"]>;

/**
 * A builder page's sections, drawn with the data they asked for.
 *
 * The body of the cached `/pages/<slug>` route and of its owner-preview twin.
 * The two differ only in how they read, which is why `reads` is a parameter:
 * the cached route must never touch the request (`publicStorefront`), and the
 * preview must, for the token that turns the page into its draft.
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
  const sections = prepareSections(page.sections);
  const needs = new Set(sectionListNeeds(sections));
  // One call for every product section, plus each store-wide list only when a
  // section reads it — the full chrome's header already fetched the categories,
  // and Next memoises the identical request.
  const [data, categories, tags, campaigns] = await Promise.all([
    reads.getSectionData(slug, sectionDataRequests(sections)),
    needs.has("categories") ? reads.getStoreCategories(slug) : null,
    needs.has("tags") ? reads.getStoreTags(slug) : null,
    needs.has("campaigns") ? reads.getStoreCampaigns(slug) : null,
  ]);
  const templates = resolveTemplates(store);
  return (
    <PageSections
      sections={sections}
      context={{
        base,
        currency: store.currency,
        storeName: store.name,
        categories: categories ?? [],
        tags: tags ?? [],
        campaigns: campaigns ?? [],
        imageFit: mediaFitFor(templates.imageFit),
        imageRatio: mediaRatioFor(templates.imageRatio),
      }}
      data={data}
    />
  );
}
