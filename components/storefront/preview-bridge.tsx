"use client";

import { useEffect } from "react";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * Live-preview receiver. Active only when the storefront is loaded with
 * `?preview=1` (the admin Customize editor's iframe). It announces readiness to the
 * parent and applies streamed draft theme values into the preview store, which
 * the shell reads so the whole page repaints live. No effect on normal visitors.
 */
export function StorePreviewBridge() {
  const apply = useSfPreview((s) => s.apply);
  const activate = useSfPreview((s) => s.activate);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPreview =
      new URLSearchParams(window.location.search).get("preview") === "1";
    if (!isPreview) return;

    activate();
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== "ezycore-preview") return;
      const p = d.payload || {};
      apply({
        brand: p.theme?.brandColor,
        accent: p.theme?.accentColor,
        logoStyle: p.theme?.logo,
        homeCollections: p.theme?.homeCollections,
        home: p.templates?.home,
        footer: p.templates?.footer,
        header: p.templates?.header,
        cardStyle: p.templates?.productCard,
        cardActions: p.templates?.cardActions,
        pagination: p.templates?.pagination,
        imageFit: p.templates?.imageFit,
        collection: p.templates?.collection,
        product: p.templates?.product,
        checkout: p.templates?.checkout,
        badges: p.trustBadges,
        heroSlides: p.heroSlides,
        heroSrc: p.templates?.hero,
        heroBanner: p.heroBanner,
        headerMenuSrc: p.templates?.headerMenu,
        navHeader: p.nav?.header,
        announcement: p.nav?.announcement,
        collections: p.collections,
        footerGroups: p.nav?.footer,
        footerContentPages: p.nav?.footerContentPages,
        // Footer copy. Sent raw, so `""` reaches the store as a real draft
        // ("cleared → show the localized default") rather than as "not drafted".
        footerText: p.footerText,
        footerNote: p.footerNote,
        footerContactHeading: p.footerContactHeading,
        footerNewsletter: p.footerNewsletter,
        // Explicit `null` when the merchant has the launcher off — the store
        // can't use a `?? saved` fallback for it, same as the images below.
        contactButton: p.contactButton,
        // Sent as explicit `null` when there is no image — see the store's note
        // on why these two can't use a `?? saved` fallback downstream.
        logo: p.logo,
        banner: p.banner,
      });
    };
    window.addEventListener("message", onMsg);
    // Tell the editor we're ready so it pushes the current draft immediately.
    window.parent?.postMessage({ type: "ezycore-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, [apply, activate]);

  return null;
}
