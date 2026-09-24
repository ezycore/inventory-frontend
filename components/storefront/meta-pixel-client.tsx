"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import { useStore } from "@/services/storefront/hooks";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import type { CartItem } from "@/services/stores/use-cart-store";
import { subscribeCartAdds } from "@/lib/storefront-cart-adds";
import {
  captureFbclid,
  metaContentId,
  trackMetaEvent,
} from "@/lib/storefront-meta";

/**
 * The client half of the Meta Pixel: SPA page views, and add-to-cart.
 *
 * Renders nothing. The base tag is the server component beside this file; everything here needs
 * either the router or the cart, neither of which exists on the server.
 *
 * **Why `AddToCart` lives here rather than at the three call sites.** `addItem` is called from
 * the search grid, the card quick-buy and the product detail hook today, and the set grows — a
 * new CTA would silently stop reporting with nothing failing. `CartSync` made exactly this call
 * for the abandoned-cart mirror and its reasoning applies unchanged; one transient subscription
 * cannot be forgotten.
 *
 * It differs from `CartSync` in what it watches. `CartSync` mirrors *state*; `AddToCart` is a
 * *transition*, so this diffs previous against next and reports only the increase.
 */
export function MetaPixelClient({ slug }: { slug: string }) {
  const pathname = useStorePathname();
  const { data: store } = useStore(slug);

  // Held in a ref so the cart subscription — which must be created once — always sees the
  // current store without listing it as a dependency and re-subscribing on every refetch.
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // The click id that brought this visit, stashed for checkout to rebuild `_fbc` from when the
  // Pixel's own cookie is missing. Once per mount: it reads the URL the shopper landed on.
  useEffect(() => {
    captureFbclid();
  }, []);

  // SPA page views. The base snippet fires the first one; without this only the landing page
  // would ever be counted, because the App Router never reloads the document.
  //
  // Skips the very first run: that navigation IS the one the base snippet already reported, and
  // firing again would double every session's entry page.
  const firstPathname = useRef(true);
  useEffect(() => {
    if (firstPathname.current) {
      firstPathname.current = false;
      return;
    }
    trackMetaEvent(storeRef.current, "PageView");
  }, [pathname]);

  // ---- AddToCart ---------------------------------------------------------
  // Subscribed once, through the shared definition of an add (`subscribeCartAdds`), so Meta and
  // GA4 cannot disagree about what counted.
  useEffect(
    () => subscribeCartAdds((item, added) => report(storeRef.current, item, added)),
    [],
  );

  return null;
}

/** One `AddToCart`, for the quantity actually added rather than the line's new total. */
function report(
  store: Parameters<typeof trackMetaEvent>[0],
  item: CartItem,
  quantity: number,
): void {
  const id = metaContentId(item.productId, item.variantId);
  trackMetaEvent(store, "AddToCart", {
    currency: store?.currency,
    value: Number((item.price * quantity).toFixed(2)),
    content_ids: [id],
    content_name: item.name,
    content_type: "product",
    contents: [{ id, quantity, item_price: item.price }],
  });
}
