import { useQuery } from "@tanstack/react-query";
import { storefrontCustomersApi } from "./api";

const ROOT = ["ecommerce-customers"] as const;

export const useOnlineCustomers = () =>
  useQuery({
    queryKey: ROOT,
    queryFn: () => storefrontCustomersApi.list(),
    select: (r) => r.data,
  });

export const useOnlineCustomer = (id: string) =>
  useQuery({
    queryKey: [...ROOT, id],
    queryFn: () => storefrontCustomersApi.get(id),
    enabled: !!id,
    select: (r) => r.data,
  });
