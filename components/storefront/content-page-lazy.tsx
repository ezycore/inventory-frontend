"use client";
// coding-standard: maintained

import dynamic from "next/dynamic";

/**
 * `StoreContentPage` behind `next/dynamic`, from a client module.
 *
 * The cached `/pages/<slug>` route serves builder landing pages and content
 * pages from one page module. Imported directly, the content page's renderer
 * (content frames, rich-doc and markdown views, the page query) would join that
 * route's chunks and download on every landing page too; loaded this way it is
 * fetched only when a content page actually renders (plan Spike B).
 */
export const LazyStoreContentPage = dynamic(() =>
  import("@/components/storefront/content-page-view").then((m) => m.StoreContentPage),
);
