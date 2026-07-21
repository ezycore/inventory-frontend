import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontDashboardApi } from "./api";

export const useEcommerceDashboard = () =>
  useQuery({
    queryKey: queryKeys.storefrontDashboard.all(),
    queryFn: () => storefrontDashboardApi.get(),
    select: (r) => r.data,
  });
