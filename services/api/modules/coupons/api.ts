import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  usedCount: number;
  perShopperLimit?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  status: "active" | "inactive";
}

export interface CouponInput {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  perShopperLimit?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  status?: "active" | "inactive";
}

const base = "/ecommerce/coupons";

export const couponsApi = {
  list: (): Promise<ApiResponse<Coupon[]>> => apiClient.get(base),
  create: (body: CouponInput): Promise<ApiResponse<Coupon>> =>
    apiClient.post(base, body),
  update: (id: string, body: Partial<CouponInput>): Promise<ApiResponse<Coupon>> =>
    apiClient.put(`${base}/${id}`, body),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.delete(`${base}/${id}`),
};
