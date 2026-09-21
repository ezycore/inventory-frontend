// coding-standard: maintained
import { faviconHref, type StorefrontStore } from "@/lib/storefront-client";
import { MetaPixel } from "@/components/storefront/meta-pixel";

/**
 * What every store page puts in the document besides its body: the tab icon and
 * the Meta Pixel base tag. Server-rendered from the store payload the caller has
 * already awaited (`shop/layout.tsx`, the Storefront Builder `PageFrame`), so
 * both are in the first byte of HTML.
 *
 * **The tab icon is a raw `<link rel="icon">`, not `generateMetadata`** — React
 * hoists it into `<head>`. Metadata icons are Next-managed and get re-asserted on
 * every router-integrated navigation, flashing the platform default; the raw
 * link ships in the SSR HTML so the first paint already has the icon, and
 * `useFaviconOverride` keeps the same tag fresh client-side.
 *
 * The store logo is NOT a fallback — the favicon is the only source of the tab
 * icon — so without one the browser's implicit `/favicon.ico` answers instead
 * (`app/favicon.ico/route.ts`, which resolves the same store). ONE icon link, not
 * one per format: this tag is also what Google reads for the icon beside a
 * search result, and `faviconHref` resolves to the PNG precisely because Google
 * cannot read webp.
 *
 * **The pixel** is here so the first PageView fires on first paint instead of
 * after hydration. The sale is always reported by the backend through the
 * Conversions API; a browser `Purchase` is a per-merchant opt-in fired from
 * checkout (backend `docs/features/meta-pixel-capi.md`).
 */
export function StoreHead({ slug, store }: { slug: string; store: StorefrontStore }) {
  const favicon = faviconHref(store.favicon);
  return (
    <>
      {favicon ? <link rel="icon" href={favicon} /> : null}
      <MetaPixel
        slug={slug}
        pixelId={store.meta?.pixelId}
        pageViewEnabled={store.meta?.events.pageView !== false}
      />
    </>
  );
}
