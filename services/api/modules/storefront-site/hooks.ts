// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import { storefrontSiteApi, type SaveStorefrontSiteDraftInput } from "./api";

/*
 * Every write answers with the whole Site, and each hook writes that answer into
 * the cache itself (inline, so the invalidation gate sees it) instead of
 * refetching — Customize re-seeds from it, and a refetch could land after the
 * merchant's next edit.
 */

/** The store's look: the published Site and any unpublished draft. */
export const useStorefrontSite = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.storefrontSite.detail(),
    queryFn: () => storefrontSiteApi.get(),
    select: (r) => r.data,
    enabled,
  });

export const useStorefrontSiteRevisions = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.storefrontSite.revisions(),
    queryFn: () => storefrontSiteApi.revisions(),
    select: (r) => r.data ?? [],
    enabled,
  });

/** Customize's Save. Shoppers see nothing until publish. */
export const useSaveStorefrontSiteDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveStorefrontSiteDraftInput) => storefrontSiteApi.saveDraft(body),
    onSuccess: (res) => {
      if (res.data) qc.setQueryData(queryKeys.storefrontSite.detail(), res);
      handleMutationSuccess("Draft saved. Publish to show it to shoppers.");
    },
    onError: handleMutationError,
  });
};

export const useDiscardStorefrontSiteDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => storefrontSiteApi.discardDraft(),
    onSuccess: (res) => {
      if (res.data) qc.setQueryData(queryKeys.storefrontSite.detail(), res);
      handleMutationSuccess(res.message || "Unpublished changes discarded");
    },
    onError: handleMutationError,
  });
};

export const usePublishStorefrontSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => storefrontSiteApi.publish(),
    onSuccess: (res) => {
      if (res.data) qc.setQueryData(queryKeys.storefrontSite.detail(), res);
      handleMutationSuccess(res.message || "Store look published");
      invalidate(qc, "storefront.site.published");
    },
    onError: handleMutationError,
  });
};

/** A restore lands in the DRAFT; shoppers see it only after the next publish. */
export const useRestoreStorefrontSiteRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => storefrontSiteApi.restoreRevision(version),
    onSuccess: (res) => {
      if (res.data) qc.setQueryData(queryKeys.storefrontSite.detail(), res);
      handleMutationSuccess(res.message || "Version restored to your draft");
    },
    onError: handleMutationError,
  });
};
