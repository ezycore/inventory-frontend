// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import type { SectionData, StoreListNeed } from "@/lib/storefront-builder/section-data";
import type { StorefrontReads } from "@/lib/storefront-server";
import { mediaFitFor, mediaRatioFor, resolveTemplates } from "@/lib/storefront-templates";
import type { StorefrontPublicPage } from "@/types/api";
import {
  prepareSections,
  sectionDataRequests,
  sectionListNeeds,
  type PageSectionInstance,
  type PreparedPageSection,
} from "@/components/storefront-builder/page-sections";
import type { SectionContext } from "@/components/storefront-builder/section-view";

export type BuilderPage = NonNullable<StorefrontPublicPage["page"]>;

export interface BuilderPageData {
  /** The page's instances as saved — what the editor preview starts from. */
  instances: PageSectionInstance[];
  sections: PreparedPageSection[];
  /** Products per section instance id. */
  data: Record<string, SectionData>;
  context: SectionContext;
}

/**
 * Everything a builder page's sections draw from: one call for every product
 * section, plus each store-wide list only when a section reads it — the full
 * chrome's header already fetched the categories, and Next memoises the
 * identical request.
 *
 * `allLists` fetches the category tree, the tags and the campaigns whether or not
 * a saved section reads them. The editor preview wants that: a section added a
 * moment ago may need a list the saved page did not.
 */
export async function loadBuilderPageData(
  reads: StorefrontReads,
  {
    slug,
    base,
    store,
    page,
    allLists = false,
  }: {
    slug: string;
    base: string;
    store: StorefrontStore;
    page: BuilderPage;
    allLists?: boolean;
  },
): Promise<BuilderPageData> {
  const instances = page.sections as PageSectionInstance[];
  const sections = prepareSections(instances);
  const needs = new Set(sectionListNeeds(sections));
  const wants = (need: StoreListNeed) => allLists || needs.has(need);
  const [data, categories, tags, campaigns] = await Promise.all([
    reads.getSectionData(slug, sectionDataRequests(sections)),
    wants("categories") ? reads.getStoreCategories(slug) : null,
    wants("tags") ? reads.getStoreTags(slug) : null,
    wants("campaigns") ? reads.getStoreCampaigns(slug) : null,
  ]);
  const templates = resolveTemplates(store);
  return {
    instances,
    sections,
    data,
    context: {
      base,
      currency: store.currency,
      storeName: store.name,
      categories: categories ?? [],
      tags: tags ?? [],
      campaigns: campaigns ?? [],
      imageFit: mediaFitFor(templates.imageFit),
      imageRatio: mediaRatioFor(templates.imageRatio),
      banner: store.banner ?? null,
      trustBadges: (store.trustBadges ?? []).filter((badge) => badge.text?.trim()),
    },
  };
}
