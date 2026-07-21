import { CreateCategoryDto } from "@/types";
import type { ApiCategory, CategoryListItem } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { createResourceHooks, handleMutationSuccess } from "../query-helpers";
import { categoriesApi } from "@/services/api";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";

const categoriesHooks = createResourceHooks<ApiCategory, CreateCategoryDto, Partial<CreateCategoryDto>, CategoryListItem>(
  categoriesApi,
  queryKeys.categories,
  {
    // Product/inventory rows embed the category name.
    events: ["catalog.changed"],
  },
);

/**
 * Re-point every product in a category at the category's default VAT rate.
 *
 * `catalog.changed` covers the products whose stored rate moved and every picker
 * that could still be serving the retired rate.
 */
export const useApplyCategoryDefaultTax = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.applyDefaultTax(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message ?? "");
      invalidate(queryClient, "catalog.changed");
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
