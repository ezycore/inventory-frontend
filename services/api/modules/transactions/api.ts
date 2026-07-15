import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateExpenseDto,
  CreateIncomeDto,
  CreateTransferDto,
  PaginatedResponse,
} from "@/types";
import type {
  ApiTransaction,
  TransactionStats,
  TransactionSummary,
  TransactionTransfer,
} from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface TransactionFilters extends BaseFilters {
  type?: "income" | "expense" | "transfer";
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export const transactionsApi = {
  getAll: (
    filters: TransactionFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ApiTransaction>>> =>
    apiClient.get(`/transactions${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiTransaction>> =>
    apiClient.get(`/transactions/${id}`),

  getByAccount: (
    accountId: string,
    filters: Omit<TransactionFilters, "accountId"> = {}
  ): Promise<ApiResponse<PaginatedResponse<ApiTransaction>>> =>
    apiClient.get(`/transactions/account/${accountId}${buildQueryParams(filters)}`),

  getSummary: (
    filters: Pick<TransactionFilters, "startDate" | "endDate"> = {}
  ): Promise<ApiResponse<TransactionSummary>> =>
    apiClient.get(`/transactions/summary${buildQueryParams(filters)}`),

  getStats: (
    params: {
      period?: string;
      weekStartDay?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<TransactionStats>> =>
    apiClient.get(`/transactions/stats${buildQueryParams(params)}`),

  createIncome: (data: CreateIncomeDto): Promise<ApiResponse<ApiTransaction>> =>
    apiClient.post("/transactions/income", data),

  createExpense: (data: CreateExpenseDto): Promise<ApiResponse<ApiTransaction>> =>
    apiClient.post("/transactions/expense", data),

  createTransfer: (
    data: CreateTransferDto,
  ): Promise<ApiResponse<TransactionTransfer>> =>
    apiClient.post("/transactions/transfer", data),
};
