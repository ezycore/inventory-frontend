import { Category, CreateCategoryDto } from "@/types";
import { createResourceHooks } from "./helper";
import { categoriesApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

const categoriesHooks = createResourceHooks<Category, CreateCategoryDto>(categoriesApi, queryKeys.category);

export const useCategories = categoriesHooks.useList;
export const useCategory = categoriesHooks.useDetail;
export const useCreateCategory = categoriesHooks.useCreate;
export const useUpdateCategory = categoriesHooks.useUpdate;
export const useDeleteCategory = categoriesHooks.useDelete;

// Alias for backward compatibility
export const useAddCategory = useCreateCategory;