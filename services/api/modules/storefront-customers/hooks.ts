import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { storefrontCustomersApi, type OnlineCustomersParams } from "./api";

const ROOT = ["ecommerce-customers"] as const;

const ORDERS_PAGE_SIZE = 10;

export const useOnlineCustomers = (params: OnlineCustomersParams = {}) =>
  useQuery({
    queryKey: [...ROOT, params],
    queryFn: () => storefrontCustomersApi.list(params),
    placeholderData: keepPreviousData,
    select: (r) => r.data,
  });

export const useOnlineCustomer = (id: string) =>
  useQuery({
    queryKey: [...ROOT, id],
    queryFn: () => storefrontCustomersApi.get(id),
    enabled: !!id,
    select: (r) => r.data,
  });

export const useOnlineCustomerOrders = (
  id: string,
  page: number,
  limit: number = ORDERS_PAGE_SIZE,
) =>
  useQuery({
    queryKey: [...ROOT, id, "orders", page, limit],
    queryFn: () => storefrontCustomersApi.orders(id, { page, limit }),
    enabled: !!id,
    placeholderData: keepPreviousData,
    select: (r) => r.data,
  });
