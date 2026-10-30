// coding-standard: maintained
import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "Wishlist", index: false });
}

/**
 * The saved list, for every shopper — no sign-in, because the list is this
 * browser's (docs/plan/wishlist.md, Phase 1). The header heart opens it.
 *
 * Not 404'd when the merchant switches the wishlist off, unlike the account
 * area: that switch is a look setting the Customize preview can draft either
 * way, and a shopper who saved things keeps a way back to them. Off only hides
 * the hearts that lead here.
 */
export default function Page() {
  return <View />;
}
