import { taxesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateTaxDto } from "@/types";
import type { ApiTax } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const taxHooks = createResourceHooks<ApiTax, CreateTaxDto>(
  taxesApi,
  queryKeys.taxes,
  {
    relatedQueryKeys: [
      queryKeys.products.all(),
      queryKeys.categories.all(),
      // The PREFIX, not each URL — see the note in the categories hooks. Both
      // literals above had gone stale: the pickers now ask for
      // `status=active&…,vatCategory,isDefault`, so creating a rate never
      // refreshed the product form's dropdown.
      ["select-options"],
    ],
  },
);

export const useTaxes = taxHooks.useList;
export const useTax = taxHooks.useDetail;
export const useCreateTax = taxHooks.useCreate;
export const useUpdateTax = taxHooks.useUpdate;
export const useDeleteTax = taxHooks.useDelete;

// Alias
export const useAddTax = useCreateTax;
