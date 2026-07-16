import { queryKeys } from "@/lib/query-keys";
import { brandsApi } from "@/services/api";
import { CreateBrandDto } from "@/types";
import type { ApiBrand, BrandListItem } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const brandHooks = createResourceHooks<ApiBrand, CreateBrandDto, Partial<CreateBrandDto>, BrandListItem>(
  brandsApi,
  queryKeys.brands,
  {
    relatedQueryKeys: [
      queryKeys.products.all(),
      ["select-options", "/brands?all=true&fields=_id,name"],
      ["select-options", "/brands?all=true&fields=_id,name,isDefault"],
    ],
  },
);

export const useBrandStats = brandHooks.useStats;
export const useBrands = brandHooks.useList;
export const useBrand = brandHooks.useDetail;
export const useBrandBySlug = brandHooks.useBySlug!;
export const useCreateBrand = brandHooks.useCreate;
export const useUpdateBrand = brandHooks.useUpdate;
export const useDeleteBrand = brandHooks.useDelete;
export const useBulkDeleteBrand = brandHooks.useBulkDelete;
