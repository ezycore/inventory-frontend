// coding-standard: maintained
import type { ReactNode } from "react";
import { getStoreContext } from "@/lib/storefront-host";
import {
  getStore,
  getStoreCampaigns,
  getStorePages,
} from "@/lib/storefront-server";
import { StoreShell } from "@/components/storefront/store-shell";

// Note: the browser-tab icon (store logo) is applied client-side by
// `useFaviconOverride` in StoreShell, NOT via `generateMetadata` here. An async
// metadata icon re-resolves on every router-integrated navigation and flashes
// the platform default first — the client hook mutates the icon in place, so it
// stays put across page changes and the account tab switch's replaceState.

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
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <p className="text-sm text-gray-500">
          This store doesn&apos;t exist or isn&apos;t published yet.
        </p>
      </div>
    );
  }

  // Fetch store + footer pages + live campaigns server-side so the shell
  // paints the real name/brand/logo immediately and footer links + the
  // campaign strip are in the SSR HTML — all seeded as initialData.
  const [store, pages, campaigns] = await Promise.all([
    getStore(slug),
    getStorePages(slug),
    getStoreCampaigns(slug),
  ]);

  return (
    <StoreShell
      slug={slug}
      base={base}
      initialStore={store ?? undefined}
      initialPages={pages ?? undefined}
      initialCampaigns={campaigns ?? undefined}
    >
      {children}
    </StoreShell>
  );
}
