"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { subscribeCartAdds } from "@/lib/storefront-cart-adds";
import {
  ga4LineItem,
  ga4Money,
  trackGa4Event,
  trackGa4PageView,
  type Ga4Store,
} from "@/lib/storefront-ga4";

/**
 * The client half of the GA4 tag: SPA page views, and add-to-cart (plan `storefront-ga4.md` §3–4).
 *
 * Renders nothing. Takes the two fields it needs as props from the server-rendered store rather
 * than reading the store query, so the very first page view has them on mount — there is no
 * loading state in which it could be skipped.
 */
export function Ga4Client({
  ga4,
  currency,
}: Ga4Store) {
  const pathname = useStorePathname();
  const search = useSearchParams().toString();

  // The subset `trackGa4Event` reads, held in a ref so the cart subscription — created once —
  // never sees a stale one and never re-subscribes.
  const storeRef = useRef<Ga4Store>({ ga4, currency });
  useEffect(() => {
    storeRef.current = { ga4, currency };
  }, [ga4, currency]);

  // Page views. gtag's own is off (`send_page_view: false` in the boot script): on an App Router
  // store it would count only the landing page. This effect runs on mount — the first page view —
  // and on every pathname or query change, because a filtered or paged listing is a different URL.
  //
  // **The title arrives after the URL.** Next writes the new page's `<title>` some time after the
  // route commits — browser QA measured it still EMPTY one task later — so a fixed delay sends the
  // page view with a blank or stale title. Instead the send waits for `document.title` to become a
  // non-empty value different from the last one reported (watched on `<head>`), with a fallback
  // for a URL change that keeps its title (a filtered listing). A timer, never
  // `requestAnimationFrame`: frames do not run in a hidden tab, and a shop opened in a background
  // tab sent no page view at all until it was looked at. `lastSent` stops a Strict Mode double
  // effect or a re-render counting twice.
  const lastSent = useRef<string | null>(null);
  const lastTitle = useRef<string | null>(null);
  useEffect(() => {
    const href = window.location.href;
    if (lastSent.current === href) return;

    let done = false;
    const send = (title: string | undefined) => {
      if (done) return;
      done = true;
      lastSent.current = href;
      if (title) lastTitle.current = title;
      trackGa4PageView(storeRef.current, href, title);
    };
    const freshTitle = () => {
      const title = document.title;
      return title && title !== lastTitle.current ? title : undefined;
    };
    const check = () => {
      const title = freshTitle();
      if (title) send(title);
    };

    const observer = new MutationObserver(check);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    const first = window.setTimeout(check, 0);
    const fallback = window.setTimeout(() => send(document.title || undefined), 1500);
    return () => {
      observer.disconnect();
      window.clearTimeout(first);
      window.clearTimeout(fallback);
      // Leaving before the title settled still counts the visit — with the title only if it is
      // this page's, never the next page's.
      send(freshTitle());
    };
  }, [pathname, search]);

  // `add_to_cart`, through the one shared definition of an add — the same one Meta's uses.
  useEffect(
    () =>
      subscribeCartAdds((item, added) => {
        const store = storeRef.current;
        trackGa4Event(store, "add_to_cart", {
          ...ga4Money(store, item.price * added),
          items: [ga4LineItem(item, added)],
        });
      }),
    [],
  );

  return null;
}
