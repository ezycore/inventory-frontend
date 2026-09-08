// coding-standard: maintained
import type { ReactNode } from "react";
import { getStoreContext } from "@/lib/storefront-host";
import {
  getStore,
  getStoreCampaigns,
  getStoreCategories,
  getStorePages,
} from "@/lib/storefront-server";
import { faviconHref } from "@/lib/storefront-client";
import { StoreShell } from "@/components/storefront/store-shell";
import { MetaPixel } from "@/components/storefront/meta-pixel";

// Note: the browser-tab icon (the store's favicon) is a raw <link rel="icon"> rendered
// below (React hoists it into <head>), NOT `generateMetadata`. Metadata icons
// are Next-managed and get re-asserted on every router-integrated navigation,
// flashing the platform default. The raw link ships in the SSR HTML so the very
// first paint already has the logo (no icon-less gap before hydration), and
// `useFaviconOverride` in StoreShell keeps the same tag fresh client-side.

/** Chrome-less wrapper for the two states where there is no store to build a
 *  header from. The `.sf-root` design tokens come from the group layout above,
 *  so the page inside still renders in the storefront's own styling. */
const BareStorefront = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
    {children}
  </div>
);

/**
 * Resolves the active store from the request host (set by `proxy.ts`) and hands
 * `slug`/`base` to the client `StoreShell`. Server boundary so the slug comes
 * from the host, not a `[slug]` route param (Option A: the store lives at
 * `/shop`, and at the root on custom domains).
 */
export default async function ShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { slug, base } = await getStoreContext();

  // No store on this host: render the page anyway, bare.
  //
  // This branch used to return its own "Store unavailable" card and never render
  // `children` — which meant the pages below never *executed*, and so the
  // `notFound()` they each already call could not fire. A layout cannot set a
  // status code, so every URL of an unpublished store answered 200 with an
  // apology: a soft 404 on the whole catalogue. Letting the page run is what
  // moves the status to a real 404; the card itself now lives in `not-found.tsx`,
  // where it can be shown with the right status behind it.
  //
  // `StoreShell` is skipped deliberately — a header, nav and footer built from a
  // store that does not exist is worse than no chrome at all.
  if (!slug) return <BareStorefront>{children}</BareStorefront>;

  // Fetch store + footer pages + live campaigns + the category tree server-side
  // so the shell paints the real name/brand/logo immediately and footer links,
  // the campaign strip and every category surface are in the SSR HTML — all
  // seeded as initialData.
  //
  // Categories are seeded HERE rather than by the pages that read them because
  // the shell is the outermost consumer of that query: it creates the entry, so
  // initialData handed in by a deeper component would arrive too late to matter.
  const [store, pages, campaigns, categories] = await Promise.all([
    getStore(slug),
    getStorePages(slug),
    getStoreCampaigns(slug),
    getStoreCategories(slug),
  ]);

  // The host names a store but the payload didn't come back — unpublished, or the
  // API is down. Same reasoning as above: no chrome, and let the page decide the
  // status.
  if (!store) return <BareStorefront>{children}</BareStorefront>;

  const favicon = faviconHref(store?.favicon);

  return (
    <>
      {/* The store's favicon as tab icon, in the SSR <head> from the first byte
          (see note above). The store logo is NOT a fallback here — the favicon
          is the only source of the tab icon — so without one the browser's
          implicit /favicon.ico answers instead (`app/favicon.ico/route.ts`,
          which resolves the same store): render nothing.

          ONE icon link, not one per format. This tag is also what Google reads
          for the icon beside a search result, and `faviconHref` resolves to the
          PNG precisely because Google cannot read webp — offering both would
          just hand the crawler two candidates and no stated preference. */}
      {favicon ? <link rel="icon" href={favicon} /> : null}
      {/* Meta Pixel base tag. Rendered HERE, from the server, because `store` is already
          awaited above — so the id ships in the SSR HTML and the first PageView fires on first
          paint instead of after hydration. The sale is always reported by the backend through
          the Conversions API; a browser `Purchase` is a per-merchant opt-in fired from checkout
          (docs/features/meta-pixel-capi.md). */}
      <MetaPixel
        slug={slug}
        pixelId={store.meta?.pixelId}
        pageViewEnabled={store.meta?.events.pageView !== false}
      />
      <StoreShell
        slug={slug}
        base={base}
        initialStore={store ?? undefined}
        initialPages={pages ?? undefined}
        initialCampaigns={campaigns ?? undefined}
        initialCategories={categories ?? undefined}
      >
        {children}
      </StoreShell>
    </>
  );
}
