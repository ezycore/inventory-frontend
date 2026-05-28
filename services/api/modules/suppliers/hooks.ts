import { SupplierLedgerFilters, suppliersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateSupplierDto, Supplier } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { createResourceHooks } from "../query-helpers";

const supplierHooks = createResourceHooks<Supplier, CreateSupplierDto>(
  suppliersApi,
  queryKeys.suppliers,
  {
    relatedQueryKeys: [
      queryKeys.suppliers.all(),
      ["select-options", "/suppliers"],
    ],
  },
);

export const useSuppliers = supplierHooks.useList;
export const useSupplier = supplierHooks.useDetail;
export const useCreateSupplier = supplierHooks.useCreate;
export const useUpdateSupplier = supplierHooks.useUpdate;
export const useDeleteSupplier = supplierHooks.useDelete;

// Get supplier ledger
export const useSupplierLedger = (
  supplierId: string | null,
  filters: SupplierLedgerFilters = {},
) => {
  return useQuery({
    queryKey: queryKeys.suppliers.ledger(supplierId!, filters),
    queryFn: () => suppliersApi.getLedger(supplierId!, filters),
    enabled: !!supplierId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
