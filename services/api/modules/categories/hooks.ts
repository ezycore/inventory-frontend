import { Category, CreateCategoryDto } from "@/types";
import { createResourceHooks } from "../query-helpers";
import { categoriesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

const categoriesHooks = createResourceHooks<Category, CreateCategoryDto>(categoriesApi, queryKeys.categories);

export const useCategories = categoriesHooks.useList;
export const useCategory = categoriesHooks.useDetail;
export const useCreateCategory = categoriesHooks.useCreate;
export const useUpdateCategory = categoriesHooks.useUpdate;
export const useDeleteCategory = categoriesHooks.useDelete;
export const useCategoryStats = categoriesHooks.useStats;

// Alias for backward compatibility
export const useAddCategory = useCreateCategory;
