import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface ContentPage {
  _id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
}

export interface ContentPageInput {
  slug: string;
  title: string;
  body?: string;
  published?: boolean;
  showInFooter?: boolean;
  sortOrder?: number;
}

const base = "/ecommerce/content";

export const contentPagesApi = {
  list: (): Promise<ApiResponse<ContentPage[]>> => apiClient.get(base),
  create: (body: ContentPageInput): Promise<ApiResponse<ContentPage>> =>
    apiClient.post(base, body),
  update: (
    id: string,
    body: Partial<ContentPageInput>,
  ): Promise<ApiResponse<ContentPage>> => apiClient.put(`${base}/${id}`, body),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.delete(`${base}/${id}`),
};
