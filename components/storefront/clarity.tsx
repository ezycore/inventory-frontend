// coding-standard: maintained
import Script from "next/script";
import { ClarityClient } from "./clarity-client";
import type { StorefrontStore } from "@/lib/storefront-client";

/**
 * The Microsoft Clarity tag, rendered server-side (backend
 * `docs/plan/storefront-clarity.md`).
 *
 * Sits beside `MetaPixel` in `store-head.tsx` and for the same reason: `shop/layout.tsx` has
 * already awaited `getStore(slug)`, so the project id costs no extra request and lands in the
 * SSR HTML. `afterInteractive` puts the tag in the static HTML without blocking first paint.
 *
 * Renders nothing when the store has no Clarity — the backend omits the whole `clarity` block
 * when the merchant has it off or entered no id, so there is no flag to read here.
 *
 * **This tag does set cookies**, unless the merchant has turned them off inside their own
 * Clarity project (Settings → Setup → Advanced settings → Cookies, on by default). Microsoft's
 * docs describe a cookieless mode that holds until `consentv2` is called; measured live on
 * 2026-09-23 that is not what a default project does. `ConsentBar` sends the consent signal —
 * denied until a shopper says otherwise — but the signal does not override that project switch.
 *
 * **`preview` is not a styling concern.** A merchant clicking around their own draft from the
 * Customize editor would otherwise fill their recordings with themselves, which is how a
 * merchant concludes the tool is broken. The caller passes it; there is no client-side fallback,
 * because by the time the browser could decide, the session has already been recorded.
 */
export function Clarity({
  clarity,
  preview,
}: {
  clarity?: StorefrontStore["clarity"];
  /** True when this render is the owner's preview of an unpublished or draft store. */
  preview?: boolean;
}) {
  if (!clarity?.projectId || preview) return null;

  // Microsoft's standard loader, with the project id interpolated. The `clarity` stub it installs
  // queues calls made before the script lands, which is what lets `ClarityClient` tag the very
  // first page view without waiting for anything.
  const snippet = `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${clarity.projectId}");`;

  return (
    <>
      <Script id="ms-clarity" strategy="afterInteractive">
        {snippet}
      </Script>
      <ClarityClient cookieConsent={clarity.cookieConsent} />
    </>
  );
}
