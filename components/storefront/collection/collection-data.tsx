"use client";
// coding-standard: maintained

import { createContext, useContext, type ReactNode } from "react";
import type { Crumb } from "@/lib/storefront-breadcrumb";
import type {
  CatalogCategoryDetail,
  ProductListResult,
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
      crumbs={data.crumbs}
      layout={layout}
      pagination={pagination}
    />
  );
}
