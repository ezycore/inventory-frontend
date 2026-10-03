// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { WarrantyClaim, WarrantyLookupSale } from "@/types/api";

export type { WarrantyClaim, WarrantyLookupSale };

/** One warranty-carrying line of a looked-up sale. */
export type WarrantyLookupLine = WarrantyLookupSale["lines"][number];
export type WarrantyClaimStatus = WarrantyClaim["status"];

export interface WarrantyClaimListParams {
  status?: WarrantyClaimStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/** Body of `POST /api/warranty/claims` — one claim against one sale line. */
export interface CreateWarrantyClaimInput {
  saleId: string;
  lineIndex: number;
  quantity: number;
  issue: string;
  notes?: string;
}

/** Body of `PATCH /api/warranty/claims/:id/status`. `replaced` has its own endpoint. */
export interface UpdateWarrantyClaimStatusInput {
  status: Exclude<WarrantyClaimStatus, "replaced">;
  note?: string;
  serviceCharge?: number;
}

const base = "/warranty";

/** `apiClient.get` takes a URL only, so every list builds its own query string. */
const queryString = (params: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export const warrantyApi = {
  lookup: (q: string): Promise<ApiResponse<WarrantyLookupSale[]>> =>
    apiClient.get(`${base}/lookup${queryString({ q })}`),

  getAll: (
    filters: WarrantyClaimListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<WarrantyClaim>>> =>
    apiClient.get(`${base}/claims${queryString({ ...filters })}`),

  getById: (id: string): Promise<ApiResponse<WarrantyClaim>> =>
    apiClient.get(`${base}/claims/${id}`),

  create: (data: CreateWarrantyClaimInput): Promise<ApiResponse<WarrantyClaim>> =>
    apiClient.post(`${base}/claims`, data),

  updateStatus: (
    id: string,
    data: UpdateWarrantyClaimStatusInput,
  ): Promise<ApiResponse<WarrantyClaim>> => apiClient.patch(`${base}/claims/${id}/status`, data),

  replace: (id: string, data: { note?: string } = {}): Promise<ApiResponse<WarrantyClaim>> =>
    apiClient.post(`${base}/claims/${id}/replace`, data),
};
