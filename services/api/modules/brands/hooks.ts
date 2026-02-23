import { queryKeys } from "@/lib/query-keys";
import { brandsApi } from "@/services/api";
import { Brand, CreateBrandDto } from "@/types";
import { createResourceHooks } from "../query-helpers";

const brandHooks = createResourceHooks<Brand, CreateBrandDto>(
  brandsApi,
  queryKeys.brands,
);

export const useBrandStats = brandHooks.useStats;
export const useBrands = brandHooks.useList;
export const useBrand = brandHooks.useDetail;
export const useBrandBySlug = brandHooks.useBySlug!;
export const useCreateBrand = brandHooks.useCreate;
export const useUpdateBrand = brandHooks.useUpdate;
export const useDeleteBrand = brandHooks.useDelete;
export const useBulkDeleteBrand = brandHooks.useBulkDelete;
