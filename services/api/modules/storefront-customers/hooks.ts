import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontCustomersApi, type OnlineCustomersParams } from "./api";

const ORDERS_PAGE_SIZE = 10;

export const useOnlineCustomers = (params: OnlineCustomersParams = {}) =>
  useQuery({
    queryKey: queryKeys.storefrontCustomers.list(params),
    queryFn: () => storefrontCustomersApi.list(params),
    placeholderData: keepPreviousData,
    select: (r) => r.data,
  });

export const useOnlineCustomer = (id: string) =>
  useQuery({
    queryKey: queryKeys.storefrontCustomers.detail(id),
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
    queryKey: queryKeys.storefrontCustomers.orders(id, page, limit),
    queryFn: () => storefrontCustomersApi.orders(id, { page, limit }),
    enabled: !!id,
    placeholderData: keepPreviousData,
    select: (r) => r.data,
  });
