import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateIncomeDto, CreateExpenseDto, CreateTransferDto } from "@/types";
import type { TransactionFilters } from "@/services/api/transactions";

// Get all transactions
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionsApi.getAll(filters),
    select: (data) => data.data,
  });
}

// Get single transaction by ID
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionsApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

// Get transactions by account
export function useAccountTransactions(
  accountId: string,
  filters: Omit<TransactionFilters, "accountId"> = {}
) {
  return useQuery({
    queryKey: queryKeys.transactions.byAccount(accountId, filters),
    queryFn: () => transactionsApi.getByAccount(accountId, filters),
    select: (data) => data.data,
    enabled: !!accountId,
  });
}

// Get transaction summary
export function useTransactionSummary(
  filters: Pick<TransactionFilters, "startDate" | "endDate"> = {}
) {
  return useQuery({
    queryKey: queryKeys.transactions.summary(filters),
    queryFn: () => transactionsApi.getSummary(filters),
    select: (data) => data.data,
  });
}

// Create income transaction
export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncomeDto) => transactionsApi.createIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
  });
}

// Create expense transaction
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseDto) => transactionsApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
  });
}

// Create transfer transaction
export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferDto) => transactionsApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
  });
}

// Aliases for consistency
export const useAddIncome = useCreateIncome;
export const useAddExpense = useCreateExpense;
export const useAddTransfer = useCreateTransfer;
