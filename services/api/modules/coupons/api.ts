import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ApiCoupon } from "@/types/api";

// Response shape generated from the backend `couponDto`. Kept under `Coupon`.
export type Coupon = ApiCoupon;

export interface CouponInput {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number | null;
  perShopperLimit?: number | null;
  minOrderValue?: number | null;
  maxDiscountAmount?: number | null;
  status?: "active" | "inactive";
}

const base = "/ecommerce/coupons";

export interface CouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const couponsApi = {
  list: (): Promise<ApiResponse<Coupon[]>> => apiClient.get(base),
  // Adapter for DataTable's self-contained mode: the backend returns the full
  // list, so search/status filtering and pagination are applied client-side
  // and wrapped in the PaginatedResponse shape DataTable expects.
  getAll: async (
    params: CouponListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<Coupon>>> => {
    const res = await couponsApi.list();
    const all = res.data ?? [];
    const search = (params.search ?? "").trim().toLowerCase();
    const status = params.status ?? "";
    const filtered = all.filter(
      (c) =>
        (!search || c.code.toLowerCase().includes(search)) &&
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
  create: (body: CouponInput): Promise<ApiResponse<Coupon>> =>
    apiClient.post(base, body),
  update: (id: string, body: Partial<CouponInput>): Promise<ApiResponse<Coupon>> =>
    apiClient.put(`${base}/${id}`, body),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.delete(`${base}/${id}`),
};
