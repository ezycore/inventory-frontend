// coding-standard: maintained
import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import { storePages } from "@/lib/storefront-page-controls";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "Search", index: false });
}

/**
 * The search page, which the merchant may switch off (§6 page controls).
 *
 * A 404 rather than an empty page: with search off the header field is gone
 * too, so the only ways here are an old link or a typed URL, and both should
 * hear that this shop has no search — not be shown a box that finds things the
 * merchant decided not to offer.
 */
export default async function Page() {
  const { slug } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  if (store && !storePages(store).search) notFound();
  return <View />;
}
