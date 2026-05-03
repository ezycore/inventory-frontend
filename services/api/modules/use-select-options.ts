import { apiClient } from "@/services/api";
import type { SelectOption } from "@/ui/components/form/type";
import { sanitize } from "@/utils";
import { useQuery } from "@tanstack/react-query";

/**
 * Generic utility hook for fetching select options from any API endpoint
 * Module-independent and can be used across the entire application
 *
 * @param url - API endpoint URL (if null/undefined, query won't run)
 * @returns TanStack Query result with transformed options data
 *
 * Usage:
 * - Products: useSelectOptions('/api/categories')
 * - Users: useSelectOptions('/api/roles')
 * - Settings: useSelectOptions('/api/languages')
 * - Any module: useSelectOptions('/api/your-endpoint')
 */
export const useSelectOptions = (
  url: string | null | undefined,
  itemsCreateCallback?: (response: any) => SelectOption[],
) => {
  return useQuery({
    queryKey: ["select-options", url] as const,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
