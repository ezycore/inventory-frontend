import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys-products";
import type { Account, CreateAccountDto, UpdateAccountDto } from "@/types";
import type { AccountFilters } from "@/lib/api/accounts";

// Get all accounts
export function useAccounts(filters: AccountFilters = {}) {
  return useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: () => accountsApi.getAll(filters),
    select: (data) => data.data,
  });
}

// Get single account by ID
export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => accountsApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

// Get default account
export function useDefaultAccount() {
  return useQuery({
    queryKey: queryKeys.accounts.default(),
    queryFn: () => accountsApi.getDefault(),
    select: (data) => data.data,
  });
}

// Get account summary
export function useAccountSummary() {
  return useQuery({
    queryKey: queryKeys.accounts.summary(),
    queryFn: () => accountsApi.getSummary(),
    select: (data) => data.data,
  });
}

// Create account
export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountDto) => accountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
  });
}

// Update account
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDto }) =>
      accountsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.detail(variables.id),
      });
    },
  });
}

// Delete account
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
  });
}

// Bulk delete accounts
export function useBulkDeleteAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => accountsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
  });
}

// Aliases for consistency with other hooks
export const useAddAccount = useCreateAccount;
