import { CreateCategoryDto } from "@/types";
import type { ApiCategory, CategoryListItem } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { createResourceHooks, handleMutationSuccess } from "../query-helpers";
import { categoriesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

const categoriesHooks = createResourceHooks<ApiCategory, CreateCategoryDto, Partial<CreateCategoryDto>, CategoryListItem>(
  categoriesApi,
  queryKeys.categories,
  {
    relatedQueryKeys: [
      queryKeys.products.all(),
      // The PREFIX, not each URL. `invalidateQueries` matches by prefix, and the
      // full URL is the cache key — so listing them by hand meant every time a
      // picker's `fields=` changed, the list silently stopped matching and the
      // dropdown kept serving a stale category. That had already happened twice.
      ["select-options"],
    ],
  },
);

/**
 * Re-point every product in a category at the category's default VAT rate.
 *
 * Invalidates products (their stored rate changed) and the whole select-options
 * prefix, so any open picker stops serving the retired rate.
 */
export const useApplyCategoryDefaultTax = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.applyDefaultTax(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message ?? "");
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: ["select-options"] });
    },
    onError: handleMutationError,
  });
};

export const useCategories = categoriesHooks.useList;
export const useCategory = categoriesHooks.useDetail;
export const useCreateCategory = categoriesHooks.useCreate;
export const useUpdateCategory = categoriesHooks.useUpdate;
export const useDeleteCategory = categoriesHooks.useDelete;
export const useCategoryStats = categoriesHooks.useStats;

// Alias for backward compatibility
export const useAddCategory = useCreateCategory;
