import { useQuery } from "@tanstack/react-query";
import { storefrontDashboardApi } from "./api";

export const useEcommerceDashboard = () =>
  useQuery({
    queryKey: ["ecommerce-dashboard"],
    queryFn: () => storefrontDashboardApi.get(),
    select: (r) => r.data,
  });
