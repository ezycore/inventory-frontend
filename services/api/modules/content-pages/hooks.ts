import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { handleMutationSuccess } from "../query-helpers";
import { contentPagesApi, type ContentPageInput } from "./api";

const ROOT = ["content-pages"] as const;

export const useContentPages = () =>
  useQuery({
    queryKey: ROOT,
    queryFn: () => contentPagesApi.list(),
    select: (r) => r.data,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ROOT });

export const useCreateContentPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContentPageInput) => contentPagesApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Page created");
      invalidate(qc);
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
      invalidate(qc);
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
      invalidate(qc);
    },
    onError: handleMutationError,
  });
};
