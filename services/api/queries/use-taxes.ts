import { taxesApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { CreateTaxDto, Tax } from "@/types";
import { createResourceHooks } from "./helper";

const taxHooks = createResourceHooks<Tax, CreateTaxDto>(
  taxesApi,
  queryKeys.taxes
);

export const useTaxes = taxHooks.useList;
export const useTax = taxHooks.useDetail;
export const useCreateTax = taxHooks.useCreate;
export const useUpdateTax = taxHooks.useUpdate;
export const useDeleteTax = taxHooks.useDelete;

// Alias
export const useAddTax = useCreateTax;
