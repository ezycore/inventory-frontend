// coding-standard: maintained
import { faviconHref, type StorefrontStore } from "@/lib/storefront-client";
import { Clarity } from "@/components/storefront/clarity";
import { ConsentBar } from "@/components/storefront/consent-bar";
import { Ga4 } from "@/components/storefront/ga4";
import { MetaPixel } from "@/components/storefront/meta-pixel";

/**
 * What every store page puts in the document besides its body: the tab icon, the
 * Meta Pixel base tag and the Microsoft Clarity tag. Server-rendered from the
 * store payload the caller has already awaited (`shop/layout.tsx`, the Storefront
 * Builder `PageFrame`), so all three are in the first byte of HTML.
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
 * **Clarity** and **GA4** sit beside it — the merchant's own projects, absent unless they
 * configured them, and skipped entirely in owner preview so a merchant does not record or count
 * themselves. The **consent bar** is mounted here, once, when either is on: the banner is a store
 * setting, and one answer serves both tools (backend `docs/plan/storefront-ga4.md` §5).
 *
 * **The pixel** is here so the first PageView fires on first paint instead of
 * after hydration. The sale is always reported by the backend through the
 * Conversions API; a browser `Purchase` is a per-merchant opt-in fired from
 * checkout (backend `docs/features/meta-pixel-capi.md`).
 */
export function StoreHead({
  slug,
  store,
  preview,
}: {
  slug: string;
  store: StorefrontStore;
  /**
   * True when this render is the owner previewing their own draft.
   *
   * Passed by the caller rather than read here, because the cached `/sites` route must never
   * touch the request — that is the whole reason `StorefrontReads` is split in two. `Clarity`,
   * `Ga4` and the consent bar read it: the Meta Pixel is a merchant's ad measurement and they
   * may legitimately want their own visits in it, while a recording or a visit count of the
   * merchant clicking around their own draft is noise they did not ask for.
   */
  preview?: boolean;
}) {
  const favicon = faviconHref(store.favicon);
  // Owner preview loads neither tool, so there is nothing to ask consent for.
  const cookieTools = !preview && (!!store.clarity || !!store.ga4);
  return (
    <>
      {favicon ? <link rel="icon" href={favicon} /> : null}
      <MetaPixel
        slug={slug}
        pixelId={store.meta?.pixelId}
        pageViewEnabled={store.meta?.events.pageView !== false}
      />
      <Clarity clarity={store.clarity} preview={preview} />
      <Ga4 store={store} preview={preview} />
      {cookieTools ? (
        <ConsentBar
          mode={store.cookieBanner ?? store.clarity?.cookieConsent ?? "off"}
          clarity={!!store.clarity}
          ga4={!!store.ga4}
        />
      ) : null}
    </>
  );
}
