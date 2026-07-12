import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface OnlineCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface OnlineCustomerOrder {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
}

export interface OnlineCustomerDetail {
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    createdAt: string;
  };
  stats: { orders: number; totalSpent: number; lastOrderAt: string | null };
  orders: OnlineCustomerOrder[];
}

const base = "/ecommerce/customers";

export const storefrontCustomersApi = {
  list: (): Promise<ApiResponse<OnlineCustomer[]>> => apiClient.get(base),
  get: (id: string): Promise<ApiResponse<OnlineCustomerDetail>> =>
    apiClient.get(`${base}/${id}`),
};
