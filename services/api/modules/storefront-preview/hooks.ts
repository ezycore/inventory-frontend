// coding-standard: maintained
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontPreviewApi } from "./api";

/**
 * A preview token for this workspace's own storefront.
 *
 * A **query**, not a mutation, and the endpoint is a GET to match: nothing is
 * created or stored — the token is derived from the caller's session — so the
 * editor can simply hold one, and every consumer of the preview shares the same
 * cached token instead of minting one apiece.
 *
 * `staleTime` is set well inside the backend's TTL so an editor left open across
 * a remount re-mints rather than putting an expired token in the iframe URL,
 * where it would read as "this store isn't published yet" — the exact screen the
 * whole feature exists to remove.
 */
export const useStorefrontPreviewToken = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.organization.storefrontPreview(),
    queryFn: () => storefrontPreviewApi.getToken(),
    select: (r) => r.data,
    staleTime: 60 * 60 * 1000,
    enabled,
  });
