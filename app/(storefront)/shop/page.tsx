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
import { storeJsonLd } from "@/lib/storefront-jsonld";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { JsonLd } from "@/components/storefront/json-ld";
import { storeHref } from "@/lib/storefront-links";
import { fullImageUrl } from "@/lib/storefront-image";
import { StoreHome } from "@/components/storefront/store-home";
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
  const title = store.seo?.title || store.name;
  const description =
    store.seo?.description || `Shop ${store.name} online — order with delivery.`;
  // Already chained server-side (socialImage → banner → logo) — see StorefrontStore.
  const image = fullImageUrl(store.socialImage);
  const images = image ? [{ url: image }] : undefined;
  // Custom domain wins over the serving host — see lib/storefront-canonical.ts.
  const target = canonicalTarget(store, { origin, base });
  const canonical = target.origin
    ? `${target.origin}${target.base || "/"}`
    : undefined;

  // Built here rather than through `storePageMetadata` because the home page is
  // the one page with no " · Store" suffix — its title IS the store. Everything
  // else about the shape must match that helper; if you add a field there, add it
  // here too or the highest-authority URL on the site is the one missing it.
  return {
    title,
    description,
    metadataBase: target.origin ? new URL(target.origin) : undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: store.name,
      locale: "en_US",
      url: canonical,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
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
    // The tag facet, for `age-chips`. Joins the batch rather than being fetched
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

  // JSON-LD `url` must agree with the canonical, or the Organization node claims
  // a different home page than the <link rel="canonical"> on the same document.
  const home = canonicalTarget(store, { origin, base });
  const canonicalHome = home.origin
    ? `${home.origin}${storeHref(home.base)}`
    : "";

  return (
    <>
      {/* Ties the shop to its logo, contact details and social profiles — the
          basis of a brand/knowledge-panel result. Emitted on the home page only:
          one Organization node per site, not per page. */}
      {canonicalHome ? (
        <JsonLd data={storeJsonLd({ store, url: canonicalHome })} />
      ) : null}
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
