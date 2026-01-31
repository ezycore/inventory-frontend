import { discountsApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { CreateDiscountDto, Discount } from "@/types";
import { createResourceHooks } from "./helper";

const discountHooks = createResourceHooks<Discount, CreateDiscountDto>(
  discountsApi,
  queryKeys.discounts
);

export const useDiscounts = discountHooks.useList;
export const useDiscount = discountHooks.useDetail;
export const useCreateDiscount = discountHooks.useCreate;
export const useUpdateDiscount = discountHooks.useUpdate;
export const useDeleteDiscount = discountHooks.useDelete;

// Alias
export const useAddDiscount = useCreateDiscount;
