// coding-standard: maintained
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import { storePages } from "@/lib/storefront-page-controls";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "Your cart", index: false });
}

/**
 * The full cart page, which the merchant may switch off in favour of the drawer
 * alone (§6 page controls).
 *
 * Off ⇒ checkout, because a shopper who reached `/cart` is trying to buy and the
 * drawer cannot be opened from a URL. **A temporary redirect, not the 301 the
 * plan first named:** this switch is reversible from the admin in one click, and
 * a permanent redirect would sit in shoppers' browser caches long after the
 * merchant turned the page back on — the one failure here that we could not fix
 * by deploying anything.
 */
export default async function Page() {
  const { slug, base } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  if (store && !storePages(store).cartPage) redirect(`${base}/checkout`);
  return <View />;
}
