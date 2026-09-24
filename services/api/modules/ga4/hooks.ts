// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { handleMutationSuccess } from "../query-helpers";
import { ga4Api, type UpdateGa4SettingsBody } from "./api";

/** Google Analytics 4 settings (backend `docs/plan/storefront-ga4.md`). */

/** GET /api/organization/storefront/ga4 */
export const useGetGa4Settings = () =>
  useQuery({
    queryKey: queryKeys.organization.storefrontGa4(),
    queryFn: () => ga4Api.get(),
    select: (r) => r.data,
  });

/**
 * PATCH /api/organization/storefront/ga4
 *
 * Seeds the cache from its own response, and revalidates the `site` scope because the
 * Measurement ID is rendered into the shop's SSR HTML — the same reasoning as
 * `useUpdateClaritySettings`.
 */
export const useUpdateGa4Settings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateGa4SettingsBody) => ga4Api.update(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Google Analytics settings saved");
      queryClient.setQueryData(queryKeys.organization.storefrontGa4(), result);
      void revalidateStorefront(["site"]);
    },
    onError: handleMutationError,
  });
};
