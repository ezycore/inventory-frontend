// coding-standard: maintained
import { apiClient } from "@/services/api";
import { optionSourceRoot } from "@/services/api/select-options";
import type { SelectOption } from "@/ui/components/form/type";
import { sanitize } from "@/utils";
import { useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * `/sales/customers?all=true&fields=…` → `["customers", "options", "<url>"]`.
 *
 * The URL is only a disambiguator between projections of the same data — it is the **root** that
 * makes a mutation refresh every dropdown listing that resource. Which root a path belongs to is
 * declared once in `services/api/select-options.ts`, not inferred here.
 *
 * Exported so a caller can read an already-fetched option list straight out of the cache
 * (`queryClient.getQueryData(selectOptionsKey(url))`) instead of re-requesting it — the product
 * VAT prefill needs the sub-category list the select beside it has already loaded. Build the `url`
 * with `selectOptions()`, never by hand, or the key will not match the one the select wrote.
 */
export const selectOptionsKey = (url: string): QueryKey => {
  const root = optionSourceRoot(url);

  if (!root) {
    // Loud on the way in, rather than a dropdown that silently never refreshes. The fallback still
    // caches correctly — it just isn't reachable from any resource's invalidation.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[useSelectOptions] no option source for "${url}". Add it to OPTION_SOURCES in ` +
          `services/api/select-options.ts and build the URL with selectOptions(), or its dropdown ` +
          `will not refresh after a mutation.`,
      );
    }
    return ["select-options", url];
  }
  return [...root, "options", url];
};

/**
 * Fetches `{ label, value }` options for a `<select>` from any API endpoint.
 *
 * @param url - API endpoint URL (if null/undefined, the query does not run)
 * @param itemsCreateCallback - optional custom transform when the default shape doesn't fit
 *
 * Usage: `useSelectOptions(selectOptions("categories", { fields: "_id,name" }))` —
 * build the URL with `selectOptions`, never by hand. See `services/api/select-options.ts`.
 */
export const useSelectOptions = (
  url: string | null | undefined,
  itemsCreateCallback?: (response: any) => SelectOption[],
) => {
  return useQuery({
    queryKey: url ? selectOptionsKey(url) : ["select-options", null],
    queryFn: async (): Promise<SelectOption[]> => {
      if (!url) return [];

      // Use the centralized API client instead of fetch
      const response = (await apiClient.get(url)) as any;
      if (itemsCreateCallback) {
        return itemsCreateCallback(response);
      }
      const items = response?.data?.items || [];
      //create options for getVariantByProductId
      if (response.data && response.data.getVariantByProductId) {
        //create label by attrivutes. attributes is a object key value pair
        let options = items.map((item: any) => ({
          value: item._id || item.id,
          label: Object.entries(item.attributes)
            .map(([key, val]) => `${key}: ${val}`)
            .join(", "),
          disabled: item.disabled || false,
        }));
        return options;
      }

      // Transform data - expect API to return data.data.items format
      // and convert to {label, value}[] format
      let options = items.map((item: any) => ({
        ...sanitize(item),
        value: item._id || item.id,
        label: item.name || item.label,
        disabled: item.disabled || false,
      }));
      return options;
    },
    enabled: !!url, // Only run query if URL is provided
    // No staleTime override: the app default (1 min) applies. The old 5-minute window existed to make
    // dropdowns feel cheap when invalidation could not be relied on — it is now just a longer window
    // in which to be wrong.
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
