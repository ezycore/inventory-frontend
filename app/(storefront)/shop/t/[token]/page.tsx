import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

/**
 * `noindex` is not optional here. The URL contains the buyer's tracking token, so
 * an indexed tracking page would put a working credential — and one buyer's order
 * details — into a search engine.
 */
export async function generateMetadata() {
  return storePageMetadata({ title: "Order status", index: false });
}

export default function Page() {
  return <View />;
}
