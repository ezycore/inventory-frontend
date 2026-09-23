import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ApiCampaign } from "@/types/api";

// Response shape generated from the backend `campaignDto`. Kept under `Campaign`.
export type Campaign = ApiCampaign;
export type CampaignScope = ApiCampaign["scope"];

export interface CampaignInput {
  name: string;
  /** Landing-page tagline. The slug is generated server-side, never sent. */
  subtitle?: string;
  /**
   * Create the campaign's editable page alongside it. Create-only — an existing
   * campaign gets one from `createPage()` below, and loses one by deleting that
   * page in Pages.
   */
  createPage?: boolean;
  scope: CampaignScope;
  targets?: string[];
  type: "percentage" | "fixed";
  value: number;
  startsAt: string;
  endsAt: string;
  status?: "active" | "inactive";
}

const base = "/ecommerce/campaigns";

export interface CampaignListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const campaignsApi = {
  list: (): Promise<ApiResponse<Campaign[]>> => apiClient.get(base),
  // Adapter for DataTable's self-contained mode: backend returns the full
  // list, so search/status filtering and pagination happen client-side and
  // are wrapped in the PaginatedResponse shape DataTable expects.
  getAll: async (
    params: CampaignListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<Campaign>>> => {
    const res = await campaignsApi.list();
    const all = res.data ?? [];
    const search = (params.search ?? "").trim().toLowerCase();
    const status = params.status ?? "";
    const filtered = all.filter(
      (c) =>
        (!search || c.name.toLowerCase().includes(search)) &&
        (!status || c.status === status),
    );
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const page = params.page && params.page > 0 ? params.page : 1;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    return {
      success: res.success,
      message: res.message,
      data: {
        items: filtered.slice(start, start + limit),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },
  create: (body: CampaignInput): Promise<ApiResponse<Campaign>> =>
    apiClient.post(base, body),
  update: (
    id: string,
    body: Partial<CampaignInput>,
  ): Promise<ApiResponse<Campaign>> => apiClient.put(`${base}/${id}`, body),
  /** Build the campaign's editable page after the fact. Idempotent. */
  createPage: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.post(`${base}/${id}/page`, {}),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.delete(`${base}/${id}`),
};
