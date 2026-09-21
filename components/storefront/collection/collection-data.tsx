"use client";
// coding-standard: maintained

import { createContext, useContext, type ReactNode } from "react";
import type { Crumb } from "@/lib/storefront-breadcrumb";
import type {
  CatalogCategoryDetail,
  ProductListResult,
  StoreCampaignDetail,
} from "@/lib/storefront-client";
import { CollectionPageView } from "@/components/storefront/collection/collection-page";

/**
 * What a collection page's route resolved on the server — the seeded first page
 * of results, which page it is, and (on `/{category}`) the collection itself.
 *
 * **Why a context and not props:** a collection page can be a builder page, and
 * then its core section draws the grid — but a section is rendered by the page's
 * section runtime, which knows nothing about this route's params or its data. The
 * route puts what it fetched here, and the core section takes it out. That keeps
 * the fetching where it belongs (the route owns the URL, the cache key and the
 * JSON-LD) and leaves the section a render.
 *
 * Absent means "no route data": the grid then fetches for itself, which is what
 * the editor's preview of this page does.
 */
export interface CollectionRouteData {
  initialProducts?: ProductListResult;
  initialPage?: number;
  collection?: CatalogCategoryDetail;
  /**
   * Set by `/campaigns/{slug}`. It has to travel with the route data for the
   * same reason `collection` does: once the collection page is on the builder,
   * the grid is drawn by a core section that knows nothing about the route — and
   * a campaign page whose section dropped the scope would quietly list the whole
   * catalogue under a sale banner.
   */
  campaign?: StoreCampaignDetail;
  crumbs?: Crumb[];
}

const CollectionDataContext = createContext<CollectionRouteData>({});

export function CollectionDataProvider({
  value,
  children,
}: {
  value: CollectionRouteData;
  children: ReactNode;
}) {
  return (
    <CollectionDataContext.Provider value={value}>{children}</CollectionDataContext.Provider>
  );
}

/**
 * The campaign's banner and its products, drawn from whatever the route
 * resolved. The core section of a campaign page.
 *
 * Separate from `CollectionFromRoute` rather than a flag on it: the two are the
 * core sections of two different page kinds, and each must draw its own page
 * even if a stored instance somehow arrived on the wrong one. `campaign` is
 * still passed when the banner is hidden — it is what scopes the grid to the
 * sale, and dropping it would list the whole catalogue under the merchant's own
 * headline.
 */
export function CampaignFromRoute({
  layout,
  pagination,
  hideBanner,
}: {
  layout?: string;
  pagination?: string;
  hideBanner?: boolean;
} = {}) {
  const data = useContext(CollectionDataContext);
  return (
    <CollectionPageView
      initialProducts={data.initialProducts}
      initialPage={data.initialPage ?? 1}
      campaign={data.campaign}
      hideCampaignBanner={hideBanner}
      layout={layout}
      pagination={pagination}
    />
  );
}

/** The grid, drawn from whatever the route resolved. Used by the core section. */
export function CollectionFromRoute({
  layout,
  pagination,
}: {
  layout?: string;
  pagination?: string;
} = {}) {
  const data = useContext(CollectionDataContext);
  return (
    <CollectionPageView
      initialProducts={data.initialProducts}
      initialPage={data.initialPage ?? 1}
      collection={data.collection}
      campaign={data.campaign}
      crumbs={data.crumbs}
      layout={layout}
      pagination={pagination}
    />
  );
}
