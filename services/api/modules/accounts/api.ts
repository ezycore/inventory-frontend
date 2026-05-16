import { apiClient } from "@/lib/api-client";
import type {
  Account,
  AccountSummary,
  ApiResponse,
  CreateAccountDto,
  PaginatedResponse,
  UpdateAccountDto,
} from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface AccountFilters extends BaseFilters {
  type?: "cash" | "bank" | "mfs" | "custom";
  isActive?: boolean;
}

export const accountsApi = {
  getAll: (
    filters: AccountFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Account>>> =>
    apiClient.get(`/accounts${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<Account>> =>
    apiClient.get(`/accounts/${id}`),

  getDefault: (): Promise<ApiResponse<Account>> =>
    apiClient.get("/accounts/default"),

  getSummary: (): Promise<ApiResponse<AccountSummary>> =>
    apiClient.get("/accounts/summary"),

  create: (data: CreateAccountDto): Promise<ApiResponse<Account>> =>
    apiClient.post("/accounts", data),

  update: (id: string, data: UpdateAccountDto): Promise<ApiResponse<Account>> =>
    apiClient.put(`/accounts/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/accounts/${id}`),

  bulkDelete: (ids: string[]): Promise<ApiResponse<{ deleted: number }>> =>
    apiClient.post("/accounts/bulk-delete", { ids }),
};
