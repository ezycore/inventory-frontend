import { CreateCategoryDto } from "@/types";
import type { ApiCategory, CategoryListItem } from "@/types/api";
import { createResourceHooks } from "../query-helpers";
import { categoriesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

const categoriesHooks = createResourceHooks<ApiCategory, CreateCategoryDto, Partial<CreateCategoryDto>, CategoryListItem>(
  categoriesApi,
  queryKeys.categories,
  { relatedQueryKeys: [queryKeys.products.all(), 
    [ "select-options", "/categories?all=true&fields=_id,name"],
    [ "select-options", "/categories?all=true&fields=_id,name,isDefault"]
  ] },
);

export const useCategories = categoriesHooks.useList;
export const useCategory = categoriesHooks.useDetail;
export const useCreateCategory = categoriesHooks.useCreate;
export const useUpdateCategory = categoriesHooks.useUpdate;
export const useDeleteCategory = categoriesHooks.useDelete;
export const useCategoryStats = categoriesHooks.useStats;

// Alias for backward compatibility
export const useAddCategory = useCreateCategory;
