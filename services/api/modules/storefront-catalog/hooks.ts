import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { handleMutationSuccess } from "../query-helpers";
import {
  BulkStorefrontDto,
  CatalogListParams,
  UpdateStorefrontListingDto,
  storefrontCatalogApi,
} from "./api";

const ROOT = ["storefront-catalog"] as const;
const keys = {
  list: (params: unknown) => [...ROOT, "list", params] as const,
};

export const useCatalogProducts = (params: CatalogListParams) =>
  useQuery({
    queryKey: keys.list(params),
    queryFn: () => storefrontCatalogApi.list(params),
    select: (r) => r.data,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ROOT });

export const useUpdateCatalogListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      v:
        | ({ id: string } & UpdateStorefrontListingDto)
        | { id: string; formData: FormData },
    ) => {
      if ("formData" in v) return storefrontCatalogApi.update(v.id, v.formData);
      const { id, ...dto } = v;
      return storefrontCatalogApi.update(id, dto);
    },
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Listing updated");
      invalidateAll(qc);
    },
    onError: handleMutationError,
  });
};

export const useBulkUpdateCatalogListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkStorefrontDto) => storefrontCatalogApi.bulkUpdate(dto),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Listings updated");
      invalidateAll(qc);
    },
    onError: handleMutationError,
  });
};
