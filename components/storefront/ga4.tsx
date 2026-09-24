// coding-standard: maintained
import { Suspense } from "react";
import Script from "next/script";
import { Ga4Client } from "./ga4-client";
import { ga4BootScript } from "@/lib/storefront-ga4";
import type { StorefrontStore } from "@/lib/storefront-client";

/**
 * The Google Analytics 4 tag, rendered server-side (backend `docs/plan/storefront-ga4.md` §3).
 *
 * Two pieces, deliberately different:
 *
 * 1. **An inline boot script** — a plain `<script>`, not `next/script`. The browser runs it while
 *    parsing the SSR HTML, so `dataLayer`, `gtag` and the consent default exist before hydration
 *    and before any React effect. Every event is queued from the first one; none is dropped for
 *    arriving before the library.
 * 2. **The library loader** via `next/script` `afterInteractive`, so gtag.js never competes with
 *    first paint. When it lands it drains the queue in order.
 *
 * Renders nothing when the store has no GA4 (the backend omits the block) **or in owner
 * preview** — the same rule as Clarity: a merchant clicking through their own draft must not
 * count as visits.
 */
export function Ga4({
  store,
  preview,
}: {
  store: StorefrontStore;
  /** True when this render is the owner's preview of an unpublished or draft store. */
  preview?: boolean;
}) {
  const measurementId = store.ga4?.measurementId;
  if (!measurementId || preview) return null;

  return (
    <>
      <script
        id="ga4-boot"
        dangerouslySetInnerHTML={{
          __html: ga4BootScript(measurementId, store.cookieBanner ?? "off"),
        }}
      />
      <Script
        id="ga4-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      />
      {/* `useSearchParams` needs a Suspense boundary, or the whole layout opts out of static
          rendering. The client renders nothing, so the fallback is nothing too. */}
      <Suspense fallback={null}>
        <Ga4Client ga4={store.ga4} currency={store.currency} />
      </Suspense>
    </>
  );
}
