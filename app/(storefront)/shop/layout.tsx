// coding-standard: maintained
import type { ReactNode } from "react";
import { getStoreContext, getStorePreviewToken } from "@/lib/storefront-host";
import {
  getStore,
  getStoreCampaigns,
  getStoreCategories,
  getStorePages,
} from "@/lib/storefront-server";
import { StoreShell } from "@/components/storefront/store-shell";
import { StoreHead } from "@/components/storefront/store-head";
import { StorefrontPreviewBanner } from "@/components/storefront/preview-banner";

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
 *
 * Reads the request, so every route beneath it renders per request. Pages that
 * can be cached are rewritten onto `app/(storefront)/sites` instead
 * (`lib/storefront-sites.ts`).
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
  // Same token the fetches below carry; read here only to decide whether to say
  // so. `getStorePreviewToken` reads the request header the proxy set.
  const previewToken = await getStorePreviewToken();

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

  return (
    <>
      <StoreHead slug={slug} store={store} />
      {/* Owner preview is remembered in a cookie for four hours, so it long
          outlives the trip from the Customize editor — without this the merchant
          cannot tell their preview from their live shop, and a draft page in the
          footer reads as a leak. See `preview-banner.tsx`. */}
      {previewToken ? <StorefrontPreviewBanner /> : null}
      <StoreShell
        slug={slug}
        base={base}
        initialStore={store}
        initialPages={pages ?? undefined}
        initialCampaigns={campaigns ?? undefined}
        initialCategories={categories ?? undefined}
      >
        {children}
      </StoreShell>
    </>
  );
}
