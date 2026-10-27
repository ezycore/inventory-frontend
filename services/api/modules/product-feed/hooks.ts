// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { handleMutationSuccess } from "../query-helpers";
import { productFeedApi, type UpdateProductFeedSettingsBody } from "./api";

/** Product feed switch (backend `docs/plan/product-feed.md`). */

/** GET /api/organization/storefront/product-feed */
export const useGetProductFeedSettings = () =>
  useQuery({
    queryKey: queryKeys.organization.storefrontProductFeed(),
    queryFn: () => productFeedApi.get(),
    select: (r) => r.data,
  });

/**
 * PATCH /api/organization/storefront/product-feed
 *
 * Revalidates the `site` scope: the cached feed carries that tag, so switching it on or off takes
 * effect on the next fetch instead of up to an hour later.
 */
export const useUpdateProductFeedSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProductFeedSettingsBody) => productFeedApi.update(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Product feed settings saved");
      queryClient.setQueryData(queryKeys.organization.storefrontProductFeed(), result);
      void revalidateStorefront(["site"]);
    },
    onError: handleMutationError,
  });
};
