import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type CampaignScope = "storewide" | "category" | "product";

export interface Campaign {
  _id: string;
  name: string;
  scope: CampaignScope;
  targets: string[];
  type: "percentage" | "fixed";
  value: number;
  startsAt: string;
  endsAt: string;
  status: "active" | "inactive";
}

export interface CampaignInput {
  name: string;
  scope: CampaignScope;
  targets?: string[];
  type: "percentage" | "fixed";
  value: number;
  startsAt: string;
  endsAt: string;
  status?: "active" | "inactive";
}

const base = "/ecommerce/campaigns";

export const campaignsApi = {
  list: (): Promise<ApiResponse<Campaign[]>> => apiClient.get(base),
  create: (body: CampaignInput): Promise<ApiResponse<Campaign>> =>
    apiClient.post(base, body),
  update: (
    id: string,
    body: Partial<CampaignInput>,
  ): Promise<ApiResponse<Campaign>> => apiClient.put(`${base}/${id}`, body),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.delete(`${base}/${id}`),
};
