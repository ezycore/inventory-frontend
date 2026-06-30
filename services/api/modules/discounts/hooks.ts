import { discountsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateDiscountDto, Discount } from "@/types";
import { createResourceHooks } from "../query-helpers";

const discountHooks = createResourceHooks<Discount, CreateDiscountDto>(
  discountsApi,
  queryKeys.discounts,
  {
    relatedQueryKeys: [queryKeys.discounts.all(), 
      [ "select-options", "/discounts/purchase?all=true&status=active&fields=_id,name,value"],
      [ "select-options", "/discounts/purchase?all=true&status=active&fields=_id,name,value,isDefaultPurchase"],
      [ "select-options", "/discounts/sales?all=true&status=active&fields=_id,name,value"],
      [ "select-options", "/discounts/sales?all=true&status=active&fields=_id,name,value,isDefaultSales"]
    ],
  },
);
//  {relatedQueryKeys: [queryKeys.customers.all(), ["select-options", "/sales/customers?all=true&fields=_id,name,defaultDiscountId"]]}


export const useDiscounts = discountHooks.useList;
export const useDiscount = discountHooks.useDetail;
export const useCreateDiscount = discountHooks.useCreate;
export const useUpdateDiscount = discountHooks.useUpdate;
export const useDeleteDiscount = discountHooks.useDelete;
export const useDiscountStats = discountHooks.useStats;

// Alias
export const useAddDiscount = useCreateDiscount;
