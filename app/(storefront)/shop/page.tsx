// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * The store's `/` when it has no builder home.
 *
 * A store's home is its `home` builder page (Pages → Home), which `proxy.ts`
 * rewrites `/` onto (`sitesHomePath`) whenever the backend has one. This route
 * is only reached when it does not — an unknown host, an unpublished store, a
 * store whose home was never created, or a failed lookup — and it answers 404
 * (`not-found.tsx`, the "Store unavailable" card). A missing home is a hard
 * failure, never a second renderer.
 */
export const metadata: Metadata = {
  title: "Store unavailable",
  robots: { index: false, follow: false },
};

export default function StoreHomePage() {
  notFound();
}
