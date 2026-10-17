import { SupplierLedgerFilters, suppliersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateSupplierDto } from "@/types";
import type { ApiSupplier, SupplierListItem } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { createResourceHooks } from "../query-helpers";

const supplierHooks = createResourceHooks<ApiSupplier, CreateSupplierDto, Partial<CreateSupplierDto>, SupplierListItem>(
  suppliersApi,
  queryKeys.suppliers,
  {
    events: ["party.changed"],
  },
);

export const useSuppliers = supplierHooks.useList;
export const useSupplier = supplierHooks.useDetail;
export const useCreateSupplier = supplierHooks.useCreate;
export const useUpdateSupplier = supplierHooks.useUpdate;
export const useDeleteSupplier = supplierHooks.useDelete;

/**
 * What the shop owes suppliers, for the header above the supplier list — read off the list
 * response, summed from the same `SupplierDue` rows as each row's Due, so they cannot disagree.
 */
export const useSupplierTotals = () => {
  return useQuery({
    queryKey: queryKeys.suppliers.totals(),
    queryFn: () => suppliersApi.getAll({ limit: 1 }),
    select: (res) =>
      (res?.data as unknown as {
        totals?: { payable: number; creditorCount: number; creditBalance: number };
      })?.totals,
    staleTime: 60 * 1000,
  });
};

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

// Get account-wide supplier statement (for printing). Pre-fetched while the
// ledger sheet is open so the print can run synchronously in the click.
export const useSupplierStatement = (
  supplierId: string | null,
  filters: { startDate?: string; endDate?: string } = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.suppliers.statement(supplierId!, filters),
    queryFn: () => suppliersApi.getStatement(supplierId!, filters),
    enabled: !!supplierId && enabled,
    staleTime: 1 * 60 * 1000,
  });
};
