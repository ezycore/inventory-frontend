// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getStore,
  getStoreCampaigns,
  getStoreCategories,
  getStoreProducts,
  getStoreTags,
} from "@/lib/storefront-server";
import { getStoreContext } from "@/lib/storefront-host";
import { buildStoreHomeMetadata } from "@/lib/storefront-metadata";
import { StoreHome } from "@/components/storefront/store-home";
import { StoreHomeJsonLd } from "@/components/storefront/store-home-json-ld";
import { resolveSections } from "@/lib/storefront-templates";
import {
  DEFAULT_SECTION_LIMIT,
  configFor,
  configuredSections,
  sectionSignature,
} from "@/lib/storefront-sections";
import { HOME_PRESET_SECTIONS, isSectionId } from "@/lib/storefront-section-ids";

// Host-resolved (dynamic render); product/store data is cached via the
// fetch-level `revalidate` in lib/storefront-server.ts.
export const revalidate = 60;

/** No store here. `noindex` matters even though the page answers 404 — the two
 *  say the same thing, and the metadata is what a crawler reads if the status is
 *  ever masked by a CDN error page. */
const UNAVAILABLE: Metadata = {
  title: "Store unavailable",
  robots: { index: false, follow: false },
};

export async function generateMetadata(): Promise<Metadata> {
  const { slug, base, origin } = await getStoreContext();
  if (!slug) return UNAVAILABLE;
  const store = await getStore(slug);
  if (!store) return UNAVAILABLE;
  // Shared with a landing page used as the homepage — see `buildStoreHomeMetadata`.
  return buildStoreHomeMetadata(store, { origin, base });
}

export default async function StoreHomePage() {
  const { slug, base, origin } = await getStoreContext();

  // An unknown host, or a store that isn't published: a real 404, not a 200 that
  // apologises. `not-found.tsx` renders the "Store unavailable" card (with the
  // owner's discreet sign-in link) — this only decides the status.
  if (!slug) notFound();

  // Fetch everything the homepage might render (server-side, in parallel) so the
  // preview can toggle/reorder any section without a round-trip.
  const [store, featured, latest, categories, campaigns, tags] = await Promise.all([
    getStore(slug),
    // `inStock` on both rows: the homepage is a shop window, and a card nobody
    // can buy is dead space in the eight slots that decide whether a visitor
    // goes any further. Collection and search pages deliberately keep listing
    // sold-out products (with the sold-out treatment on the card, and ranked
    // last) — there the shopper is browsing a catalogue, not being sold to.
    //
    // `inStock` means "what a shopper can buy", so it KEEPS `backorder`
    // products — they sit at zero stock on purpose and still sell. That is the
    // behaviour this row wants; see the validator's note on why there is only
    // one flag for it.
    getStoreProducts(slug, { featured: "true", limit: DEFAULT_SECTION_LIMIT, inStock: "1" }),
    // `sort: "newest"` is REQUIRED, not a tidy-up. The catalogue's default sort
    // is `{ storefront.featured: -1, createdAt: -1 }` — featured first — which
    // is right for a collection page and wrong for a row headed "New arrivals":
    // omitting it made this section open with the same products, in the same
    // order, as the Featured row directly above it.
    getStoreProducts(slug, { limit: DEFAULT_SECTION_LIMIT, sort: "newest", inStock: "1" }),
    getStoreCategories(slug),
    getStoreCampaigns(slug),
    // The tag facet, for `tag-chips`. Joins the batch rather than being fetched
    // inside the section for the same reason everything else here does: the
    // Customize preview can add that section without a round-trip.
    getStoreTags(slug),
  ]);

  if (!store) notFound();

  // Configured sections fetch their own products — one query per DISTINCT
  // request, in one parallel round rather than a waterfall. Deduplicated by
  // signature, so two sections asking the catalogue the same thing (the same
  // collection at the same count) cost one fetch, and so the Customize preview
  // can match a re-pointed row back to a render the page already has.
  //
  // This runs after `store`/`categories` and cannot be folded into the batch
  // above: which queries to make is read off the merchant's own settings and
  // resolved against their category tree, neither of which exists yet up there.
  // `config` rather than `store.sectionConfig`: a shop that has never composed
  // its own page renders the preset's list, and a preset entry may carry config
  // of its own. Fetching against the stored list alone would ask the catalogue
  // for the wrong products on exactly those shops.
  const { sections, config: sectionConfig } = resolveSections(store, {
    isSectionId,
    presets: HOME_PRESET_SECTIONS,
    sectionConfig: store.sectionConfig,
  });
  const signatures = new Map<string, Record<string, string | number>>();
  for (const { key, query } of configuredSections(sections, sectionConfig, categories ?? [])) {
    const config = configFor(sectionConfig, key);
    if (config) signatures.set(sectionSignature(config), query);
  }
  /* The batch above ALREADY answers two of these. Since the three grids merged,
     a "New arrivals" row is a product grid sourced `newest` at the default
     limit — which is the batch's second query exactly — so the default homepage
     would otherwise fetch the same eight products twice, on a connection where
     that is the expensive part. Both signatures are derived rather than typed,
     so a change to either query above cannot silently stop matching. */
  const alreadyFetched = new Map([
    [sectionSignature({ key: "", source: "featured" }), featured?.items ?? []],
    [sectionSignature({ key: "", source: "newest" }), latest?.items ?? []],
  ]);
  const rows = await Promise.all(
    [...signatures].map(async ([signature, query]) => ({
      signature,
      items:
        alreadyFetched.get(signature) ??
        (await getStoreProducts(slug, query))?.items ??
        [],
    })),
  );

  return (
    <>
      <StoreHomeJsonLd store={store} origin={origin} base={base} />
      <StoreHome
        base={base}
        store={store}
        featured={featured?.items ?? []}
        latest={latest?.items ?? []}
        rows={rows}
        categories={categories ?? []}
        tags={tags ?? []}
        campaigns={campaigns ?? []}
      />
    </>
  );
}
