import { discountsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateDiscountDto } from "@/types";
import type { ApiDiscount } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const discountHooks = createResourceHooks<ApiDiscount, CreateDiscountDto>(
  discountsApi,
  queryKeys.discounts,
  // Products and parties carry a default-discount reference.
  { events: ["catalog.changed"] },
);


export const useDiscounts = discountHooks.useList;
export const useDiscount = discountHooks.useDetail;
export const useCreateDiscount = discountHooks.useCreate;
export const useUpdateDiscount = discountHooks.useUpdate;
export const useDeleteDiscount = discountHooks.useDelete;
export const useDiscountStats = discountHooks.useStats;

// Alias
export const useAddDiscount = useCreateDiscount;
