// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { handleMutationSuccess } from "../query-helpers";
import { marketingApi, type UpdateMarketingSettingsBody } from "./api";

/** Store-level marketing settings (backend `docs/plan/storefront-ga4.md` §5). */

/** GET /api/organization/storefront/marketing */
export const useGetMarketingSettings = () =>
  useQuery({
    queryKey: queryKeys.organization.storefrontMarketing(),
    queryFn: () => marketingApi.get(),
    select: (r) => r.data,
  });

/**
 * PATCH /api/organization/storefront/marketing
 *
 * Also refreshes the Clarity card: its `cookieConsent` is the same setting read through the
 * backend's dual-read resolver, and a stale copy there would show the old banner mode. Revalidates
 * `site` because the mode ships in the store payload the shop renders from.
 */
export const useUpdateMarketingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMarketingSettingsBody) => marketingApi.update(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Cookie banner saved");
      queryClient.setQueryData(queryKeys.organization.storefrontMarketing(), result);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization.storefrontClarity(),
      });
      void revalidateStorefront(["site"]);
    },
    onError: handleMutationError,
  });
};
