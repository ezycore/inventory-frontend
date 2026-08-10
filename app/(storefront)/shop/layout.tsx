// coding-standard: maintained
import type { ReactNode } from "react";
import { getStoreContext } from "@/lib/storefront-host";
import {
  getStore,
  getStoreCampaigns,
  getStoreCategories,
  getStorePages,
} from "@/lib/storefront-server";
import { StoreShell } from "@/components/storefront/store-shell";

// Note: the browser-tab icon (the store's favicon) is a raw <link rel="icon"> rendered
// below (React hoists it into <head>), NOT `generateMetadata`. Metadata icons
// are Next-managed and get re-asserted on every router-integrated navigation,
// flashing the platform default. The raw link ships in the SSR HTML so the very
// first paint already has the logo (no icon-less gap before hydration), and
// `useFaviconOverride` in StoreShell keeps the same tag fresh client-side.

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

  if (!slug) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        {/* This branch still answers HTTP 200 (a layout cannot set a status), so
            without an explicit noindex an unpublished or unknown store would be
            indexed as a soft 404 on every one of its URLs. React 19 hoists this
            into <head>. A real 404 status is the fuller fix — it needs the owner
            sign-in affordance in shop/page.tsx to move first. */}
        <meta name="robots" content="noindex, nofollow" />
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <p className="text-sm text-gray-500">
          This store doesn&apos;t exist or isn&apos;t published yet.
        </p>
      </div>
    );
  }

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

  const favicon = store?.favicon?.thumbnailUrl || store?.favicon?.url;

  return (
    <>
      {/* The store's favicon as tab icon, in the SSR <head> from the first byte
          (see note above). The store logo is NOT a fallback here — the favicon
          is the only source of the tab icon — so without one the browser's
          implicit /favicon.ico answers instead: render nothing. */}
      {favicon ? <link rel="icon" href={favicon} /> : null}
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
