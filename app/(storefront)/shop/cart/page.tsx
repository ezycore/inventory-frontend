// coding-standard: maintained
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import { storePages } from "@/lib/storefront-page-controls";
import { SystemPage } from "@/components/storefront-builder/system-page";

export async function generateMetadata() {
  return storePageMetadata({ title: "Your cart", index: false });
}

/**
 * The cart page — drawn by its builder page when the store has one, else by the
 * view directly (`SystemPage`).
 *
 * The merchant may also switch this page off in favour of the drawer alone (§6
 * page controls), in which case the address goes to checkout: a **temporary**
 * redirect, because the switch is reversible in one click and a permanent one
 * would outlive it in shoppers' browser caches.
 */
export default async function Page() {
  const { slug, base } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  if (store && !storePages(store).cartPage) redirect(`${base}/checkout`);
  return (
    <SystemPage path="/cart" />
  );
}
