"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { ConsentBar } from "@/components/storefront/consent-bar";
import {
  setClarityPageType,
  storefrontPageType,
  upgradeClaritySession,
} from "@/lib/storefront-clarity";

/**
 * The client half of the Clarity tag: the page-type tag, and the checkout upgrade.
 *
 * Renders only the consent bar (itself usually nothing). The base tag is the server component
 * beside this file; everything here needs the router, which does not exist on the server.
 *
 * **It does not report page views.** Clarity follows History API navigations itself, so an SPA
 * page-view call would double-count — the opposite of `MetaPixelClient`, which must fire its own
 * `PageView` because `fbq` does not watch the router. What Clarity cannot know is what *kind* of
 * page it is on, and that is the whole job of this file.
 */
export function ClarityClient({
  cookieConsent,
}: {
  cookieConsent: "off" | "eu" | "always";
}) {
  const pathname = useStorePathname();

  useEffect(() => {
    const pageType = storefrontPageType(pathname);
    // Re-tagged on every navigation: a custom tag is set on the SESSION, so the last value wins
    // and a shopper who browsed then checked out would otherwise be filed under `home` forever.
    setClarityPageType(pageType);

    // Clarity keeps up to 100k recordings per project per day and samples above that. The day a
    // merchant's shop goes viral is the day their checkout recordings matter most, so checkout
    // asks to survive that sampling. One reason string, not per-step — the recording is the
    // whole session either way.
    if (pageType === "checkout") upgradeClaritySession("checkout");
  }, [pathname]);

  // Mounted here rather than in the shell because consent only exists where the tag does: a
  // store with no Clarity has nothing to ask about, and this component does not render on one.
  return <ConsentBar mode={cookieConsent} />;
}
