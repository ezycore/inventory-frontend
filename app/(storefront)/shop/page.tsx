import type { Metadata } from "next";
import {
  getStore,
  getStoreCampaigns,
  getStoreCategories,
  getStoreProducts,
} from "@/lib/storefront-server";
import { getStoreContext } from "@/lib/storefront-host";
import { StoreHome } from "@/components/storefront/store-home";

// Host-resolved (dynamic render); product/store data is cached via the
// fetch-level `revalidate` in lib/storefront-server.ts.
export const revalidate = 60;

type Search = { preview?: string };

const Unavailable = () => (
  <div className="py-20 text-center">
    <h1 className="text-xl font-semibold">Store unavailable</h1>
    <p className="mt-1 text-sm text-gray-500">
      This store doesn&apos;t exist or isn&apos;t published yet.
    </p>
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
  const canonical = origin ? `${origin}${base || "/"}` : undefined;
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

export default async function StoreHomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { slug, base } = await getStoreContext();
  const { preview } = await searchParams;

  if (!slug) return <Unavailable />;

  // Fetch everything the homepage might render (server-side, in parallel) so the
  // preview can toggle/reorder any section without a round-trip.
  const [store, featured, latest, categories, campaigns] = await Promise.all([
    getStore(slug),
    getStoreProducts(slug, { featured: "true", limit: 8 }),
    getStoreProducts(slug, { limit: 8 }),
    getStoreCategories(slug),
    getStoreCampaigns(slug),
  ]);

  if (!store) return <Unavailable />;

  return (
    <StoreHome
      base={base}
      store={store}
      featured={featured?.items ?? []}
      latest={latest?.items ?? []}
      categories={categories ?? []}
      campaigns={campaigns ?? []}
      preview={preview === "1"}
    />
  );
}
