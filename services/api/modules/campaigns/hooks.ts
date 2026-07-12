import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { handleMutationSuccess } from "../query-helpers";
import { campaignsApi, type CampaignInput } from "./api";

const ROOT = ["campaigns"] as const;

export const useCampaigns = () =>
  useQuery({
    queryKey: ROOT,
    queryFn: () => campaignsApi.list(),
    select: (r) => r.data,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ROOT });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CampaignInput) => campaignsApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Campaign created");
      invalidate(qc);
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
      invalidate(qc);
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
      invalidate(qc);
    },
    onError: handleMutationError,
  });
};
