// coding-standard: maintained
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import type { ApiResponse } from "@/types";
import { handleMutationSuccess } from "../query-helpers";
import {
  storefrontPagesApi,
  type CreateStorefrontPageInput,
  type SaveStorefrontPageDraftInput,
  type StorefrontPage,
  type StorefrontPageListParams,
  type UpdateStorefrontPageInput,
} from "./api";

/**
 * Every write answers with the whole page, so the detail cache is written from
 * that answer instead of refetched. An editor keeps the page open while it
 * saves; a refetch would land after the merchant's next edit.
 */
const storePage = (qc: QueryClient, res: ApiResponse<StorefrontPage>) => {
  if (res.data) qc.setQueryData(queryKeys.storefrontPages.detail(res.data._id), res);
};

export const useStorefrontPages = (params: StorefrontPageListParams = {}) =>
  useQuery({
    queryKey: queryKeys.storefrontPages.list(params),
    queryFn: () => storefrontPagesApi.list(params),
    select: (r) => r.data,
  });

export const useStorefrontPage = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.storefrontPages.detail(id ?? ""),
    queryFn: () => storefrontPagesApi.get(id!),
    select: (r) => r.data,
    enabled: !!id,
  });

export const useStorefrontPageRevisions = (id: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.storefrontPages.revisions(id ?? ""),
    queryFn: () => storefrontPagesApi.revisions(id!),
    select: (r) => r.data ?? [],
    enabled: !!id && enabled,
  });

export const useCreateStorefrontPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStorefrontPageInput) => storefrontPagesApi.create(body),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Page created");
      invalidate(qc, "storefront.page.drafted");
    },
    onError: handleMutationError,
  });
};

/** Title, address, header/footer and search settings — all of which a published page shows. */
export const useUpdateStorefrontPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: UpdateStorefrontPageInput }) =>
      storefrontPagesApi.update(v.id, v.body),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Page updated");
      invalidate(qc, "storefront.page.published");
    },
    onError: handleMutationError,
  });
};

export const useDeleteStorefrontPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontPagesApi.remove(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Page deleted");
      invalidate(qc, "storefront.page.published");
    },
    onError: handleMutationError,
  });
};

/**
 * Autosave. **No success toast** — it fires every few seconds while the merchant
 * types. Errors are left to the caller, which has to tell a version conflict
 * apart from a refused section and show each where it belongs.
 */
export const useSaveStorefrontPageDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: SaveStorefrontPageDraftInput }) =>
      storefrontPagesApi.saveDraft(v.id, v.body),
    onSuccess: (res) => {
      storePage(qc, res);
      invalidate(qc, "storefront.page.drafted");
    },
  });
};

export const useDiscardStorefrontPageDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontPagesApi.discardDraft(id),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Changes discarded");
      invalidate(qc, "storefront.page.drafted");
    },
    onError: handleMutationError,
  });
};

export const usePublishStorefrontPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontPagesApi.publish(id),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Page published");
      invalidate(qc, "storefront.page.published");
    },
    onError: handleMutationError,
  });
};

export const useUnpublishStorefrontPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontPagesApi.unpublish(id),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Page unpublished");
      invalidate(qc, "storefront.page.published");
    },
    onError: handleMutationError,
  });
};

export const useDuplicateStorefrontPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontPagesApi.duplicate(id),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Page duplicated");
      invalidate(qc, "storefront.page.drafted");
    },
    onError: handleMutationError,
  });
};

/**
 * Use a landing page as the store's homepage, or `null` to go back to the
 * Customize home. Shoppers see the change at once: the flush also clears the
 * proxy's remembered answer about the store's `/`.
 */
export const useSetStorefrontHomePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string | null) => storefrontPagesApi.setHome(pageId),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Homepage changed");
      invalidate(qc, "storefront.home.changed");
    },
    onError: handleMutationError,
  });
};

/** A restore lands in the DRAFT; the live page changes only when it is published again. */
export const useRestoreStorefrontPageRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; version: number }) =>
      storefrontPagesApi.restoreRevision(v.id, v.version),
    onSuccess: (res) => {
      storePage(qc, res);
      handleMutationSuccess(res.message || "Version restored to your draft");
      invalidate(qc, "storefront.page.drafted");
    },
    onError: handleMutationError,
  });
};
