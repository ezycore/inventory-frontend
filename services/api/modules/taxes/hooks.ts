import { taxesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateTaxDto, Tax } from "@/types";
import { createResourceHooks } from "../query-helpers";

const taxHooks = createResourceHooks<Tax, CreateTaxDto>(
  taxesApi,
  queryKeys.taxes,
    { relatedQueryKeys: [queryKeys.products.all(), 
      [ "select-options", "/taxes?all=true&fields=_id,name,rate"],
      [ "select-options", "/taxes?all=true&fields=_id,name,rate,isDefault"]
    ] },
);

export const useTaxes = taxHooks.useList;
export const useTax = taxHooks.useDetail;
export const useCreateTax = taxHooks.useCreate;
export const useUpdateTax = taxHooks.useUpdate;
export const useDeleteTax = taxHooks.useDelete;

// Alias
export const useAddTax = useCreateTax;
