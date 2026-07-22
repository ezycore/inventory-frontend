import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import { contentPagesApi, type ContentPageInput } from "./api";

export const useContentPages = () =>
  useQuery({
    queryKey: queryKeys.contentPages.list(),
    queryFn: () => contentPagesApi.list(),
    select: (r) => r.data,
  });

export const useCreateContentPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContentPageInput) => contentPagesApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Page created");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useUpdateContentPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: Partial<ContentPageInput> }) =>
      contentPagesApi.update(v.id, v.body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Page updated");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useDeleteContentPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentPagesApi.remove(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Page deleted");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};
