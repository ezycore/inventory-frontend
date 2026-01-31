import type {
  ApiResponse,
  CreateExpenseDto,
  CreateIncomeDto,
  CreateTransferDto,
  PaginatedResponse,
  Transaction,
  TransactionSummary,
} from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

export interface TransactionFilters extends BaseFilters {
  type?: "income" | "expense" | "transfer";
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export function createTransactionsApi(apiClient: any) {
  return {
    getAll: (
      filters: TransactionFilters = {}
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> =>
      apiClient.get(`/transactions${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<Transaction>> =>
      apiClient.get(`/transactions/${id}`),

    getByAccount: (
      accountId: string,
      filters: Omit<TransactionFilters, "accountId"> = {}
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> =>
      apiClient.get(`/transactions/account/${accountId}${buildQueryParams(filters)}`),

    getSummary: (
      filters: Pick<TransactionFilters, "startDate" | "endDate"> = {}
    ): Promise<ApiResponse<TransactionSummary>> =>
      apiClient.get(`/transactions/summary${buildQueryParams(filters)}`),

    createIncome: (data: CreateIncomeDto): Promise<ApiResponse<Transaction>> =>
      apiClient.post("/transactions/income", data),

    createExpense: (data: CreateExpenseDto): Promise<ApiResponse<Transaction>> =>
      apiClient.post("/transactions/expense", data),

    createTransfer: (data: CreateTransferDto): Promise<ApiResponse<{ outgoing: Transaction; incoming: Transaction }>> =>
      apiClient.post("/transactions/transfer", data),
  };
}
