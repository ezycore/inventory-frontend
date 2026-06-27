import type { ReactNode } from "react";
import { getStoreContext } from "@/lib/storefront-host";
import { StoreShell } from "@/components/storefront/store-shell";

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

  return (
    <StoreShell slug={slug} base={base}>
      {children}
    </StoreShell>
  );
}
