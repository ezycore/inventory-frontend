// coding-standard: maintained
import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import { storePages } from "@/lib/storefront-page-controls";
import { SystemPage } from "@/components/storefront-builder/system-page";
import { SearchPageView } from "@/components/storefront/search/search-page";

export async function generateMetadata() {
  return storePageMetadata({ title: "Search", index: false });
}

/**
 * The search page, drawn by its builder page when the store has one.
 *
 * A merchant may switch search off (§6 page controls); then this 404s rather
 * than showing a box that finds things they decided not to offer — the header
 * field is gone too, so the only ways here are an old link or a typed URL.
 */
export default async function Page() {
  const { slug } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  if (store && !storePages(store).search) notFound();
  return (
    <SystemPage path="/search">
      <SearchPageView />
    </SystemPage>
  );
}
