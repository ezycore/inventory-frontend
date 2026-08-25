import { apiClient } from "@/lib/api-client";
import type {
  AccountPaymentOption,
  AccountSummary,
  ApiResponse,
  CreateAccountDto,
  PaginatedResponse,
  UpdateAccountDto,
} from "@/types";
import type { ApiAccount } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface AccountFilters extends BaseFilters {
  type?: "cash" | "bank" | "mfs" | "custom";
  isActive?: boolean;
}

export const accountsApi = {
  getAll: (
    filters: AccountFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ApiAccount>>> =>
    apiClient.get(`/accounts${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiAccount>> =>
    apiClient.get(`/accounts/${id}`),

  getDefault: (): Promise<ApiResponse<ApiAccount>> =>
    apiClient.get("/accounts/default"),

  getSummary: (): Promise<ApiResponse<AccountSummary>> =>
    apiClient.get("/accounts/summary"),

  // Minimal id/name/isDefault list for the sale/purchase payment picker —
  // reachable by sales.create/purchases.create as well as accounts.view.
  getPaymentOptions: (): Promise<ApiResponse<AccountPaymentOption[]>> =>
    apiClient.get("/accounts/payment-options"),

  create: (data: CreateAccountDto): Promise<ApiResponse<ApiAccount>> =>
    apiClient.post("/accounts", data),

  update: (id: string, data: UpdateAccountDto): Promise<ApiResponse<ApiAccount>> =>
    apiClient.put(`/accounts/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/accounts/${id}`),

  bulkDelete: (ids: string[]): Promise<ApiResponse<{ deleted: number }>> =>
    apiClient.post("/accounts/bulk-delete", { ids }),
};
