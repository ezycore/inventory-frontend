// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { handleMutationSuccess } from "../query-helpers";
import { clarityApi, type UpdateClaritySettingsBody } from "./api";

/** Microsoft Clarity settings (backend `docs/plan/storefront-clarity.md`). */

/** GET /api/organization/storefront/clarity */
export const useGetClaritySettings = () =>
  useQuery({
    queryKey: queryKeys.organization.storefrontClarity(),
    queryFn: () => clarityApi.get(),
    select: (r) => r.data,
  });

/**
 * PATCH /api/organization/storefront/clarity
 *
 * Seeds the cache from its own response rather than invalidating — the backend answers with the
 * full settings object, so a refetch would ask again for what is already in hand.
 *
 * Revalidates the `site` scope because the project id and the consent mode are rendered into the
 * shop's own SSR HTML: without it a merchant who pastes an id sees nothing happen until the
 * `store:{slug}` cache entry expires, which reads as the feature being broken.
 */
export const useUpdateClaritySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateClaritySettingsBody) => clarityApi.update(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Clarity settings saved");
      queryClient.setQueryData(
        queryKeys.organization.storefrontClarity(),
        result,
      );
      void revalidateStorefront(["site"]);
    },
    onError: handleMutationError,
  });
};
