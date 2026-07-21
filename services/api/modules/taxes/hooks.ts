import { taxesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateTaxDto } from "@/types";
import type { ApiTax } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const taxHooks = createResourceHooks<ApiTax, CreateTaxDto>(
  taxesApi,
  queryKeys.taxes,
  {
    // Products and categories store a rate snapshot.
    events: ["catalog.changed"],
  },
);

export const useTaxes = taxHooks.useList;
export const useTax = taxHooks.useDetail;
export const useCreateTax = taxHooks.useCreate;
export const useUpdateTax = taxHooks.useUpdate;
export const useDeleteTax = taxHooks.useDelete;

// Alias
export const useAddTax = useCreateTax;
