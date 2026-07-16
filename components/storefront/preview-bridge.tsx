"use client";

import { useEffect } from "react";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * Live-preview receiver. Active only when the storefront is loaded with
 * `?preview=1` (the admin Theme editor's iframe). It announces readiness to the
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
        home: p.templates?.home,
        footer: p.templates?.footer,
        header: p.templates?.header,
        cardStyle: p.templates?.productCard,
        badges: p.trustBadges,
        heroSlides: p.heroSlides,
        heroSrc: p.templates?.hero,
        headerMenuSrc: p.templates?.headerMenu,
        navHeader: p.nav?.header,
        collections: p.collections,
      });
    };
    window.addEventListener("message", onMsg);
    // Tell the editor we're ready so it pushes the current draft immediately.
    window.parent?.postMessage({ type: "ezycore-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, [apply, activate]);

  return null;
}
