// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * A `/pages/<slug>` the store does not serve.
 *
 * `proxy.ts` rewrites every page the store has onto the `app/(storefront)/sites`
 * routes. What lands here is a page that does not exist, a slug outside the
 * backend's grammar, or a `/shop/pages/…` request on a host that names no store
 * — each answered with the shop's own 404 (`not-found.tsx`).
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function StorePageNotFound() {
  notFound();
}
