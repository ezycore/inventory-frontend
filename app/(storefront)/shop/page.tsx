import type { Metadata } from "next";
import {
  getStore,
  getStoreCampaigns,
  getStoreCategories,
  getStoreProducts,
} from "@/lib/storefront-server";
import { getStoreContext } from "@/lib/storefront-host";
import { adminUrlForDomain } from "@/lib/admin-url";
import { storeJsonLd } from "@/lib/storefront-jsonld";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { JsonLd } from "@/components/storefront/json-ld";
import { storeHref } from "@/lib/storefront-links";
import { StoreHome } from "@/components/storefront/store-home";

// Host-resolved (dynamic render); product/store data is cached via the
// fetch-level `revalidate` in lib/storefront-server.ts.
export const revalidate = 60;

// `adminUrl` is passed only on a custom domain (never redirect a shopper to an
// admin login) — it gives the store owner a discreet path back into their app.
const Unavailable = ({ adminUrl }: { adminUrl?: string }) => (
  <div className="py-20 text-center">
    <h1 className="text-xl font-semibold">Store unavailable</h1>
    <p className="mt-1 text-sm text-gray-500">
      This store doesn&apos;t exist or isn&apos;t published yet.
    </p>
    {adminUrl && (
      <p className="mt-4 text-sm text-gray-500">
        Store owner?{" "}
        <a href={adminUrl} className="font-medium text-primary hover:underline">
          Sign in
        </a>
      </p>
    )}
  </div>
);

export async function generateMetadata(): Promise<Metadata> {
  const { slug, base, origin } = await getStoreContext();
  if (!slug) return { title: "Store" };
  const store = await getStore(slug);
  if (!store) return { title: "Store" };
  const title = store.seo?.title || store.name;
  const description =
    store.seo?.description || `Shop ${store.name} online — order with delivery.`;
  const image = store.banner?.url || store.logo?.url;
  // Custom domain wins over the serving host — see lib/storefront-canonical.ts.
  const target = canonicalTarget(store, { origin, base });
  const canonical = target.origin
    ? `${target.origin}${target.base || "/"}`
    : undefined;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function StoreHomePage() {
  const { slug, base, origin } = await getStoreContext();
  // Only on a custom domain (base === "") does the store live at the root and
  // does an admin app exist at admin.<domain>; offer the owner link there.
  const adminUrl = base === "" && origin ? adminUrlForDomain(origin) : undefined;

  if (!slug) return <Unavailable adminUrl={adminUrl} />;

  // Fetch everything the homepage might render (server-side, in parallel) so the
  // preview can toggle/reorder any section without a round-trip.
  const [store, featured, latest, categories, campaigns] = await Promise.all([
    getStore(slug),
    // `hideSoldOut` on both rows: the homepage is a shop window, and a card
    // nobody can buy is dead space in the eight slots that decide whether a
    // visitor goes any further. Collection and search pages deliberately keep
    // listing sold-out products (with the sold-out treatment on the card) —
    // there the shopper is browsing a catalogue, not being sold to.
    // NOT `inStock`: that drops `backorder` products too, and those sit at zero
    // stock on purpose and still sell. See the validator's note on the two flags.
    getStoreProducts(slug, { featured: "true", limit: 8, hideSoldOut: "1" }),
    // `sort: "newest"` is REQUIRED, not a tidy-up. The catalogue's default sort
    // is `{ storefront.featured: -1, createdAt: -1 }` — featured first — which
    // is right for a collection page and wrong for a row headed "New arrivals":
    // omitting it made this section open with the same products, in the same
    // order, as the Featured row directly above it.
    getStoreProducts(slug, { limit: 8, sort: "newest", hideSoldOut: "1" }),
    getStoreCategories(slug),
    getStoreCampaigns(slug),
  ]);

  if (!store) return <Unavailable adminUrl={adminUrl} />;

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
        categories={categories ?? []}
        campaigns={campaigns ?? []}
      />
    </>
  );
}
