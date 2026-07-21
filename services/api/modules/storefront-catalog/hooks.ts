import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
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
  variants: (id: string) => [...ROOT, "variants", id] as const,
};

export const useCatalogProducts = (params: CatalogListParams) =>
  useQuery({
    queryKey: queryKeys.storefrontCatalog.list(params),
    queryFn: () => storefrontCatalogApi.list(params),
    select: (r) => r.data,
  });

/** Per-variant pricing rows for the editor; only fetched for variable products. */
export const useCatalogVariants = (id: string | null, enabled: boolean) =>
  useQuery({
    queryKey: keys.variants(id ?? ""),
    queryFn: () => storefrontCatalogApi.listVariants(id as string),
    select: (r) => r.data,
    enabled: !!id && enabled,
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
      invalidate(qc, "storefront.catalog.changed");
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
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

// ---- Collections (storefront category overlay) ----------------------------

export const useStorefrontCollections = () =>
  useQuery({
    queryKey: queryKeys.storefrontCatalog.collections(),
    queryFn: () => storefrontCatalogApi.listCollections(),
    select: (r) => r.data,
  });

export const useUpdateCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; isListed?: boolean; displayName?: string }) =>
      storefrontCatalogApi.updateCollection(v.id, {
        isListed: v.isListed,
        displayName: v.displayName,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Collection updated");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useReorderCollections = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => storefrontCatalogApi.reorderCollections(ids),
    // Server returns the re-sorted list; seed the cache so the UI doesn't flash.
    onSuccess: (res) => {
      if (res.data) qc.setQueryData(queryKeys.storefrontCatalog.collections(), res);
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};
