import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import { campaignsApi, type CampaignInput } from "./api";

export const useCampaigns = () =>
  useQuery({
    queryKey: queryKeys.campaigns.list(),
    queryFn: () => campaignsApi.list(),
    select: (r) => r.data,
  });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CampaignInput) => campaignsApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Campaign created");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useUpdateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: Partial<CampaignInput> }) =>
      campaignsApi.update(v.id, v.body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Campaign updated");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

/**
 * Give an existing campaign the page the merchant declined at create time.
 *
 * Dirties the storefront catalogue (the campaign row now carries a `pageId`) AND
 * the page lists, because the new page has to appear on the Pages screen without
 * a reload.
 */
export const useCreateCampaignPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignsApi.createPage(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Campaign page created");
      invalidate(qc, "storefront.catalog.changed", "storefront.page.published");
    },
    onError: handleMutationError,
  });
};

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignsApi.remove(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Campaign deleted");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};
