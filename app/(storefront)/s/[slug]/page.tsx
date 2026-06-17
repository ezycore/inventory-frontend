"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useStore,
  useStoreCampaigns,
  useStoreCategories,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { DEFAULT_HOMEPAGE_SECTIONS } from "@/lib/storefront-theme";
import { ProductCard } from "@/components/storefront/product-card";

export default function StoreHomePage() {
  const slug = String(useParams().slug);
  const { data: store } = useStore(slug);

  const order =
    store?.theme?.homepageSections && store.theme.homepageSections.length > 0
      ? store.theme.homepageSections
      : DEFAULT_HOMEPAGE_SECTIONS;

  // Only fetch a section's products when that section is actually enabled.
  const { data: featured } = useStoreProducts(
    slug,
    { featured: "true", limit: 8 },
    order.includes("featured"),
  );
  const { data: latest, isLoading } = useStoreProducts(
    slug,
    { limit: 8 },
    order.includes("products"),
  );
  const { data: categories } = useStoreCategories(slug);
  const { data: campaigns } = useStoreCampaigns(slug);

  const currency = store?.currency;
  const banner = store?.banner?.url || store?.banner?.mediumUrl;
  const featuredItems = featured?.items ?? [];
  const latestItems = latest?.items ?? [];
  const promo = (campaigns ?? [])[0];
  const promoBanner = promo?.banner?.url || promo?.banner?.mediumUrl;

  const sectionMap: Record<string, React.ReactNode> = {
    banner: (
      <section className="overflow-hidden rounded-xl border bg-white">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt={store?.name ?? ""} className="h-48 w-full object-cover md:h-64" />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gray-100 p-6 text-center">
            <div>
              <h1 className="text-2xl font-bold">{store?.name ?? "Welcome"}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse our products and order online.
              </p>
            </div>
          </div>
        )}
      </section>
    ),
    categories:
      categories && categories.length > 0 ? (
        <section className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c._id}
              href={`/s/${slug}/products?categoryId=${c._id}`}
              className="rounded-full border bg-white px-3 py-1 text-sm hover:bg-gray-100"
            >
              {c.name}
            </Link>
          ))}
        </section>
      ) : null,
    featured:
      featuredItems.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Featured</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredItems.map((p) => (
              <ProductCard key={p._id} slug={slug} product={p} currency={currency} />
            ))}
          </div>
        </section>
      ) : null,
    products: (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <Link
            href={`/s/${slug}/products`}
            className="text-sm text-[var(--sf-accent,#2563eb)] hover:underline"
          >
            View all →
          </Link>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : latestItems.length === 0 ? (
          <p className="text-sm text-gray-500">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {latestItems.map((p) => (
              <ProductCard key={p._id} slug={slug} product={p} currency={currency} />
            ))}
          </div>
        )}
      </section>
    ),
  };

  return (
    <div className="space-y-8">
      {/* Active campaign banner (always shown above the configured layout) */}
      {promo && (
        <section className="overflow-hidden rounded-xl border bg-rose-50">
          {promoBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={promoBanner} alt={promo.name} className="h-40 w-full object-cover md:h-52" />
          ) : (
            <div className="p-4 text-center text-rose-700">
              <p className="font-semibold">{promo.name}</p>
              <p className="text-sm">
                {promo.type === "percentage"
                  ? `${promo.value}% off`
                  : `${promo.value} off`}{" "}
                — limited time
              </p>
            </div>
          )}
        </section>
      )}

      {order.map((id) =>
        sectionMap[id] ? (
          <div key={id}>{sectionMap[id]}</div>
        ) : null,
      )}
    </div>
  );
}
