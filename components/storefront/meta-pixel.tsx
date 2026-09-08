import Script from "next/script";
import { MetaPixelClient } from "./meta-pixel-client";

/**
 * The Meta Pixel base tag, rendered server-side.
 *
 * `shop/layout.tsx` already awaits `getStore(slug)` before it renders, so the pixel id costs no
 * extra request and lands in the SSR HTML — which is the point: the first `PageView` fires on
 * first paint rather than after hydration. Same reasoning as the store favicon `<link>` beside it.
 *
 * A Server Component on purpose. `next/script` needs no client boundary here, and
 * `afterInteractive` puts the tag in the static HTML without blocking first paint. The client
 * half (SPA page views, add-to-cart) is `MetaPixelClient`, mounted below.
 *
 * Renders nothing when the store has no pixel — the backend omits the whole `meta` block when
 * the merchant has it off, so there is no flag to read here.
 *
 * **No `Purchase` is fired from this file**, and none can be: this renders the base tag and
 * nothing else. The sale is always reported by the backend through the Conversions API at the
 * merchant's chosen trigger. A merchant may additionally opt into a browser `Purchase`
 * (`events.purchase`), which fires from checkout's `onSuccess` via `trackMetaPurchase` —
 * see `lib/storefront-meta.ts`. That switch is not read here; it only needs `fbq` to exist,
 * which is what this file guarantees.
 */
export function MetaPixel({
  slug,
  pixelId,
  pageViewEnabled,
}: {
  /** Passed to the client half so it can read the store from the shared query cache. */
  slug: string;
  pixelId?: string;
  /** The merchant's PageView switch. The base tag still loads when off — `ViewContent` and the
   *  others need `fbq` to exist — but the automatic first PageView is suppressed. */
  pageViewEnabled: boolean;
}) {
  if (!pixelId) return null;

  // Meta's standard loader. `fbq('init')` always runs; the opening `PageView` is conditional so
  // a merchant who turned page views off does not get one anyway from the snippet itself.
  const snippet = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
${pageViewEnabled ? "fbq('track', 'PageView');" : ""}`;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {snippet}
      </Script>
      <MetaPixelClient slug={slug} />
    </>
  );
}
