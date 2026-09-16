// coding-standard: maintained
import {
  storefrontPagesApi,
  type StorefrontPageListParams,
} from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

/** The page kinds the Pages screen lists in a table of their own. */
export type ListedPageKind = "landing" | "content";

/**
 * A page table's fetcher and its cache key, built from the same `kind`.
 *
 * They have to come as a pair. `DataTable` keys its cache as
 * `[...queryKey, { page, limit }]` and never sees the fetcher's arguments, so two
 * tables on one screen with the same base key share a single cache entry: the
 * Landing pages and Store pages tables both read `["storefront-pages", "list",
 * { page: 1, limit: 10 }]`, and whichever loaded first filled both — a cut-over
 * store's Store pages table listed its landing page. With the kind in the key the
 * two entries are distinct, and every page mutation still reaches both through
 * the shared `storefrontPages.lists()` prefix.
 */
export function pageListOperations(kind: ListedPageKind) {
  return {
    getAllData: (params: StorefrontPageListParams = {}) =>
      storefrontPagesApi.list({ ...params, kind }),
    queryKey: queryKeys.storefrontPages.list({ kind }),
  };
}
